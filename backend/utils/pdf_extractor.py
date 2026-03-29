"""
PDF text extraction utility using pdfplumber.
Used by: Tax Wizard (Form 16), MF Portfolio X-Ray (CAMS/KFintech statement)
"""
import io
import pdfplumber
from fastapi import UploadFile, HTTPException


async def extract_text_from_upload(file: UploadFile) -> str:
    """
    Extracts raw text from an uploaded PDF file.
    Reads the file from FastAPI's UploadFile object.

    Args:
        file: FastAPI UploadFile object from the route handler

    Returns:
        Raw extracted text as a single string

    Raises:
        HTTPException 400 if file is not a PDF
        HTTPException 422 if PDF is empty or unreadable
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a .pdf file."
        )

    try:
        contents = await file.read()
        return extract_text_from_bytes(contents)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not read uploaded file: {str(e)}"
        )


def extract_text_from_bytes(pdf_bytes: bytes, password: str = None) -> str:
    """
    Extracts raw text from PDF bytes.
    Useful when PDF is already in memory (e.g. from demo_data).

    Args:
        pdf_bytes: Raw PDF file content as bytes
        password: Optional string containing the PDF password

    Returns:
        Raw extracted text as a single string

    Raises:
        HTTPException 422 if PDF is empty, unreadable, or password incorrect
    """
    try:
        text = ""

        with pdfplumber.open(io.BytesIO(pdf_bytes), password=password) as pdf:
            if not pdf.pages:
                raise HTTPException(
                    status_code=422,
                    detail="PDF appears to be empty — no pages found."
                )

            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        text = text.strip()

        if not text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from PDF. "
                       "Make sure it is not a scanned image-only PDF."
            )

        return text

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"PDF extraction failed: {str(e)}"
        )


def extract_text_from_path(file_path: str) -> str:
    """
    Extracts raw text directly from a file path on disk.
    Used for loading demo_data PDFs during the hackathon demo.

    Args:
        file_path: Relative or absolute path to the PDF

    Returns:
        Raw extracted text as a single string
    """
    try:
        with open(file_path, "rb") as f:
            pdf_bytes = f.read()
        return extract_text_from_bytes(pdf_bytes)

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Demo PDF not found at path: {file_path}"
        )