# Security Policy

## Supported Versions
This project is currently in MVP stage. Security fixes are applied on the latest main branch.

## Reporting a Vulnerability
If you discover a security issue:
1. Do not open a public issue with exploit details.
2. Send a private report with reproduction steps and impact.
3. Include affected endpoint or file path when possible.

## Secrets Handling
- Never commit .env files.
- Use separate keys for local, staging, and production.
- Rotate keys immediately after accidental exposure.

## Minimum Hardening Before Production
- Enforce JWT verification on backend endpoints.
- Restrict CORS origins to known domains.
- Add request rate limits and abuse protections.
- Avoid direct execution of untrusted generated code.
