UPI SAFETY COACH — VERCEL-READY PROJECT

WHY YOUR PREVIOUS DEPLOYMENT SHOWED "NOT FOUND"
The uploaded source files had names such as index(7).html and style(8).css,
but the website references /index.html and /style.css. Vercel needs the
entry file to be named exactly index.html at the project root. This package
renames the assets consistently and adds a Vercel API route.

DEPLOY TO VERCEL
1. Extract this ZIP.
2. Open the extracted UPI_Safety_Coach_Vercel_Ready folder.
3. Upload/push the CONTENTS of this folder to a GitHub repository
   (index.html must be at the repository root, not inside another nested folder).
4. In Vercel, choose Add New > Project and import that repository.
5. Framework Preset: Other. Root Directory: ./ (the folder containing index.html).
6. Build Command: leave blank. Output Directory: leave blank. Install Command: npm install
   (or leave the default if Vercel detects it).
7. Deploy. The website and built-in 15-situation checker work without an API key.

OPTIONAL CHATGPT-POWERED MODE
1. In Vercel, open Project > Settings > Environment Variables.
2. Add OPENAI_API_KEY with your own API key as the value. Do not put it in a
   JavaScript file, HTML file, GitHub repository, or this ZIP.
3. Optionally add OPENAI_MODEL = gpt-4o-mini.
4. Apply to Production (and Preview if desired), save, then redeploy.
5. AI usage may cost money. Built-in safety checks do not require an API key.

LOCAL TEST
1. Install Node.js 18 or newer.
2. In this folder run: npm install
3. Copy .env.example to .env only if enabling AI, then add your key to .env.
4. Run: npm start
5. Open http://localhost:3000

PROJECT FILES
- index.html, style.css and browser JavaScript files: website UI.
- api/chat.js: Vercel serverless AI endpoint.
- server.js: local development server.
- vercel.json: Vercel function configuration.
- .env.example: example environment variables only; it contains no real key.

SAFETY / LIMITATIONS
This is an educational prototype, not a bank or government service. It cannot
inspect bank transactions, confirm whether a payment is safe, or file reports.
Never enter real PINs, OTPs, passwords, CVVs, card numbers or account numbers.
For suspected cyber financial fraud in India, contact your bank/payment app
promptly, call 1930, and report at https://cybercrime.gov.in/.
