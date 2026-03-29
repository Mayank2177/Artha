# Artha — AI Money Mentor

Artha is a beautiful, full-stack AI-powered personal finance dashboard and advisory platform engineered to help Indian millennials navigate their wealth. By combining powerful deterministic financial mathematics (like `pyxirr`) with the reasoning capabilities of Groq (LLaMA 3.3 70B & LLaMA 3.1 8B), Artha acts as a deeply personalized digital financial advisor.

## Features

- **Dynamic Financial Dashboard**: A central command center that aggregates your data from all modules to give you total Net Worth, current Monthly Savings, overarching XIRR, and dynamic "Quick Insights" based on your performance.
- **Money Health Score**: A 12-factor diagnostic algorithm that grades your financial foundation (0-100) and feeds your specific answers to an AI LLM to generate immediate, actionable life advice.
- **FIRE Planner**: Graphically tracks your path to Financial Independence / Retire Early (FIRE) by calculating your target corpus, inflation-adjusted expenses, and exactly how much SIP you need to run today.
- **Tax Wizard**: An interactive Old vs. New Regime calculator tailored for the latest Indian budget. Computes the most efficient tax route, highlights HRA & 80C deductions, and visualizes exactly how to keep more of your salary.
- **MF Portfolio X-Ray**: A powerful PDF extraction pipeline. Drop your CAMS / KFintech Consolidated Account Statement (password supported) into the analyzer to instantly compute your true portfolio XIRR, flag dangerous fund overlaps (where you pay double expense ratios for the same stocks), and receive a 3-step AI rebalancing plan.

## Tech Stack

**Frontend (React + Vite)**
- `framer-motion` for ultra-smooth micro-animations
- `recharts` for dynamic financial projections
- `react-countup` and `lucide-react` for premium UI details
- Context API for global Authentication & State

**Backend (Python + FastAPI)**
- `FastAPI` for high-performance async routing
- `SQLAlchemy` + `SQLite` for persistent, relational data sync across all modules
- `Groq` for sub-second, ultra-low latency LLM inference
- `pdfplumber` for strict, tabular data extraction from PDF statements
- `pyxirr` for blistering fast Internal Rate of Return (XIRR) cashflow math
- `bcrypt` + `passlib` for secure user authentication

## Running Locally

### 1. Backend Setup
Navigate to the `backend` folder and use `venv`:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # (Windows)
# source venv/bin/activate # (Mac/Linux)

pip install -r requirements.txt
```

You will need a `.env` file in the backend directory containing your API Key:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```

The React app will boot up at `http://localhost:5173`. 
*(Note: Ensure the backend is running at `http://localhost:8000` so the API functions correctly).*
