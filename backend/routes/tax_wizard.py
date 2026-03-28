"""
Tax Wizard route — Feature 03
Handles both manual input and Form 16 PDF upload flows.
Wires together: tax_engine → et_feed → tax_prompt → groq_manager
"""
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from models.tax_models import (
    ManualTaxInput,
    PDFExtractedData,
    TaxWizardResponse,
)
from calculators.tax_engine import run_tax_calculation
from ai.prompts.tax_prompt import (
    build_pdf_extraction_prompt,
    build_tax_advice_prompt,
)
from ai.groq_client import groq_manager
from utils.et_feed import get_et_context_block
from utils.pdf_extractor import extract_text_from_upload


router = APIRouter()


# ─── HELPER ───────────────────────────────────────────────────────────────────

def _build_response(
    data: ManualTaxInput,
    input_source: str,
    et_context: str,
) -> TaxWizardResponse:
    """
    Shared logic for both manual and PDF flows.
    Runs tax calculation, builds prompt, calls Groq, returns response.
    """
    # COMPUTE — run both regime calculations
    result = run_tax_calculation(data)

    # ADVISE — build prompt with all computed data + ET context
    prompt = build_tax_advice_prompt(
        data               = data,
        old_regime         = result["old_regime"],
        new_regime         = result["new_regime"],
        recommended_regime = result["recommended_regime"],
        tax_saving         = result["tax_saving_with_recommendation"],
        missed_deductions  = result["missed_deductions"],
        et_context         = et_context,
    )

    # Call Groq — LLaMA 3.3 70B for advice
    ai_advice = groq_manager.chat(
        prompt     = prompt,
        max_tokens = 1024,
    )

    return TaxWizardResponse(
        old_regime                     = result["old_regime"],
        new_regime                     = result["new_regime"],
        recommended_regime             = result["recommended_regime"],
        tax_saving_with_recommendation = result["tax_saving_with_recommendation"],
        missed_deductions              = result["missed_deductions"],
        ai_advice                      = ai_advice,
        et_context_used                = bool(et_context),
        input_source                   = input_source,
    )


# ─── ROUTE 1 — MANUAL INPUT ───────────────────────────────────────────────────

@router.post("/tax-wizard/manual", response_model=TaxWizardResponse)
async def tax_wizard_manual(data: ManualTaxInput):
    """
    Tax Wizard — Manual salary input flow.

    Frontend sends a JSON body matching ManualTaxInput schema.
    Returns full tax analysis with AI advice.

    Example request body:
    {
        "annual_ctc": 1200000,
        "basic_salary": 600000,
        "hra_received": 240000,
        "is_metro": true,
        "annual_rent_paid": 180000,
        "section_80c": 100000,
        "section_80d": 10000,
        "section_80ccd_1b": 0,
        "age": 28
    }
    """
    try:
        # Fetch ET RSS context before Groq call
        et_context = get_et_context_block("tax_wizard")

        return _build_response(
            data         = data,
            input_source = "manual",
            et_context   = et_context,
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"Tax calculation failed: {str(e)}"
        )


# ─── ROUTE 2 — PDF UPLOAD ─────────────────────────────────────────────────────

@router.post("/tax-wizard/pdf", response_model=TaxWizardResponse)
async def tax_wizard_pdf(file: UploadFile = File(...)):
    """
    Tax Wizard — Form 16 PDF upload flow.

    Frontend sends a multipart/form-data request with a PDF file.
    Flow:
        1. Extract raw text from PDF via pdfplumber
        2. Send raw text to LLaMA 8B for structured JSON extraction
        3. Parse extracted JSON into ManualTaxInput
        4. Run same calculation flow as manual route

    Accepts: .pdf files only (Form 16 or similar salary documents)
    """
    try:
        # STEP 1 — Extract raw text from uploaded PDF
        raw_text = await extract_text_from_upload(file)

        # STEP 2 — Build extraction prompt and call LLaMA 8B
        extraction_prompt = build_pdf_extraction_prompt(raw_text)
        extracted_json_str = groq_manager.extract(
            prompt     = extraction_prompt,
            max_tokens = 512,
        )

        # STEP 3 — Parse extracted JSON
        try:
            extracted_dict = json.loads(extracted_json_str)
        except json.JSONDecodeError:
            # Try to clean common LLM JSON issues
            cleaned = extracted_json_str.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            extracted_dict = json.loads(cleaned)

        # STEP 4 — Validate with PDFExtractedData schema
        extracted = PDFExtractedData(**extracted_dict)

        # STEP 5 — Build ManualTaxInput from extracted data
        # Fill missing fields with safe defaults
        tax_input = ManualTaxInput(
            annual_ctc          = extracted.annual_ctc or 0,
            basic_salary        = extracted.basic_salary or 0,
            hra_received        = extracted.hra_received or 0,
            da                  = extracted.da or 0,
            special_allowance   = extracted.special_allowance or 0,
            is_metro            = extracted.is_metro or False,
            annual_rent_paid    = extracted.annual_rent_paid or 0,
            section_80c         = extracted.section_80c or 0,
            section_80d         = extracted.section_80d or 0,
            section_80ccd_1b    = extracted.section_80ccd_1b or 0,
            home_loan_interest  = extracted.home_loan_interest or 0,
            age                 = extracted.age or 30,
        )

        # Validate that we got at least annual CTC from the PDF
        if tax_input.annual_ctc <= 0:
            raise HTTPException(
                status_code = 422,
                detail      = "Could not extract salary information from this PDF. "
                              "Please try manual input instead."
            )

        # STEP 6 — Fetch ET context and run same flow as manual
        et_context = get_et_context_block("tax_wizard")

        return _build_response(
            data         = tax_input,
            input_source = "pdf",
            et_context   = et_context,
        )

    except HTTPException:
        raise

    except json.JSONDecodeError:
        raise HTTPException(
            status_code = 422,
            detail      = "AI could not parse salary data from your PDF. "
                          "Please use manual input instead."
        )

    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"PDF processing failed: {str(e)}"
        )