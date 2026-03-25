# Contributing Guide

Thanks for your interest in contributing to Excel Killer 2 (DataChat).
This project is currently in MVP stage, so we optimize for fast iteration and clear communication.

## Ground Rules
- Keep pull requests focused and small.
- Prefer readable code over clever code.
- Include rationale for non-obvious changes.
- Do not commit secrets, tokens, or local environment files.

## Local Setup
1. Backend setup
- cd backend
- python -m venv .venv
- .venv\Scripts\activate
- pip install -r requirements.txt
- python -m uvicorn app.main:app --reload --port 8000

2. Frontend setup
- cd frontend
- npm install
- npm run dev

## Branching
- Branch naming:
  - feat/<short-description>
  - fix/<short-description>
  - chore/<short-description>

Examples:
- feat/query-history-filters
- fix/upload-validation

## Commit Message Style
Use concise, imperative commit messages.

Examples:
- feat: add csv export button
- fix: handle empty dataframe upload
- chore: update readme setup steps

## Pull Request Checklist
- Change is scoped and documented.
- No secrets in code, logs, or screenshots.
- README and env examples updated if behavior/config changed.
- Manual verification completed for impacted user flow.

## Reporting Bugs
Open an issue with:
- expected behavior
- actual behavior
- reproduction steps
- environment (OS, browser, local/prod)
- screenshots or logs when possible

## Feature Requests
Describe:
- user problem
- proposed solution
- alternatives considered
- success criteria

## Security
If you find a security issue, do not post exploit details publicly.
Follow the process in SECURITY.md.
