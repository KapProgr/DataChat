# Excel Killer 2 (DataChat)

AI-powered SaaS MVP for spreadsheet analysis.
Upload CSV/Excel files, ask natural-language questions, and receive instant insights with charts.

## Stack
- Frontend: Next.js 14, React, Tailwind, Clerk, Stripe
- Backend: FastAPI, Pandas, OpenAI-compatible LLM API
- Data/Auth/Billing: Supabase, Clerk, Stripe

## Features
- File upload (CSV, XLSX)
- Natural-language analytics queries
- Auto chart generation (bar/line/pie/scatter/table)
- Query history and usage limits
- Free and Pro plan flows
- Export results to CSV/PNG

## Project Structure
- frontend: Next.js application
- backend: FastAPI API and data processing
- start.ps1: local multi-service startup helper

## Prerequisites
- Node.js 18+
- Python 3.11+
- npm
- A Supabase project
- A Clerk project
- A Stripe account (for subscription flows)

## Environment Setup
Do not copy real keys into git-tracked files.
Use the provided template files:
- backend/.env.example -> create backend/.env
- frontend/.env.local.example -> create frontend/.env.local

## Run Locally
### 1) Backend
- Open terminal in backend
- Create venv and install deps:
  - python -m venv .venv
  - .venv\Scripts\activate
  - pip install -r requirements.txt
- Start API:
  - python -m uvicorn app.main:app --reload --port 8000

### 2) Frontend
- Open terminal in frontend
- Install deps:
  - npm install
- Start dev server:
  - npm run dev

### 3) Optional helper
From repo root:
- ./start.ps1

## Security Notes
- Never commit .env files.
- Never expose service role, secret, webhook, or private API keys.
- Rotate any key immediately if accidentally shared.

## GitHub Release Checklist
- Confirm .gitignore is present and correct.
- Ensure no secrets in tracked files.
- Add screenshots/demo GIF.
- Add architecture notes and roadmap.
- Create first release tag after initial stable commit.

## License
Choose a license before public release (MIT recommended for open source, or keep repository private).
