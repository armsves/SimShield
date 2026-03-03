# SimShield

Payment validation for physical POS using Nokia Network as Code APIs. Validates transactions by comparing the customer's SIM location with the POS location, checking for SIM/device swaps, verifying identity against operator KYC records, and scoring risk before processing payment.

## Business Case

Physical POS fraud—especially SIM swap attacks—costs retailers millions in chargebacks and lost trust. SimShield uses live network signals to verify that the person at the terminal is the legitimate cardholder before payment is authorized.

| Problem | SimShield solution |
|--------|--------------------|
| **SIM swap fraud** | Network detects recent SIM change; blocks high-risk transactions before they occur |
| **Remote / card-not-present fraud** | Location APIs confirm the phone is physically at the POS |
| **Identity mismatch** | KYC Match verifies customer data against operator records |
| **Device takeover** | Device Swap flags recent device changes that may indicate account compromise |

**Outcomes:** fewer chargebacks, lower fraud losses, faster checkout (no extra customer friction), and compliance-ready identity verification for high-value transactions.

## Tech Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Serverless APIs** for validation
- **Nokia Network as Code** – 5 APIs: Location Retrieval, Location Verification, SIM Swap, Device Swap, KYC Match

## Flow

1. **POS** collects: customer phone, amount, POS location (optionally KYC data for identity verification)
2. **Validate** → Serverless API calls Nokia Network as Code APIs
3. **Score** computed from:
   - SIM location vs POS (strongest signal)
   - Recent SIM swap
   - Recent device swap
   - KYC match (identity vs operator records)
   - API availability
4. **Decision**:
   - **Approve** (score ≥ 70) → Process payment
   - **Clarify** (40–69) → Telegram LLM chatbot contacts customer (to be implemented)
   - **Deny** (< 40) → Reject; optionally suggest card block

## Setup

```bash
npm install
cp .env.example .env
# Add NOKIA_RAPID_API_KEY from https://developer.networkascode.nokia.io/ → API Hub
npm run dev
```

Without `NOKIA_RAPID_API_KEY`, the app runs in **sandbox mode** with mock Nokia responses.

### Deploying to Vercel

1. Add env vars in **Project → Settings → Environment Variables**:
   - `NOKIA_RAPID_API_KEY` (required)
   - `NOKIA_RAPID_HOST` (optional; default `network-as-code.nokia.rapidapi.com`)
   - `NOKIA_API_BASE_URL` (optional; default `https://network-as-code.p-eu.rapidapi.com`)

2. Enable vars for **Production** (and Preview if needed).

3. Redeploy after adding variables.

4. **If API calls fail on Vercel but work locally:**
   - Call `https://your-app.vercel.app/api/debug-nokia` to see env check + raw Nokia error
   - In DevTools → Network, check the failed `/api/validate-payment` response; `message` contains the Nokia API error
   - For hackathon/regional APIs, set `NOKIA_RAPID_HOST` to the exact host shown in Nokia API Hub (it may differ from the default)
   - Ensure the env var name is exactly `NOKIA_RAPID_API_KEY` (not `RAPIDAPI_KEY` etc.)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── validate-payment/route.ts   # POST – main validation API
│   │   ├── denial/submit|status/       # Denial review flow
│   │   └── health/route.ts             # GET – health check
│   ├── layout.tsx
│   ├── page.tsx                        # Homepage
│   ├── payment/page.tsx               # POS demo
│   └── globals.css
├── lib/
│   ├── nokia/                          # Nokia API client
│   │   ├── client.ts
│   │   ├── location.ts
│   │   ├── sim-swap.ts
│   │   ├── device-swap.ts
│   │   ├── kyc-match.ts
│   │   └── types.ts
│   ├── kyc-data.ts                    # Test KYC for demo (+34640030004)
│   ├── scoring/                       # Risk scoring engine
│   │   ├── engine.ts
│   │   └── types.ts
│   └── validator.ts                   # Orchestrates Nokia + scoring
```

## API

### POST /api/validate-payment

**Request:**
```json
{
  "phoneNumber": "+34600123456",
  "posLatitude": 41.3851,
  "posLongitude": 2.1734,
  "amountCents": 5999,
  "transactionId": "optional",
  "kycData": {
    "idDocument": "ABC123",
    "name": "JOHN DOE",
    "address": "...",
    "postalCode": "...",
    "country": "ES",
    "birthdate": "1990-01-01",
    "email": "john@example.com"
  }
}
```

`kycData` is optional. For test number `+34640030004`, test KYC is auto-applied.

**Response:**
```json
{
  "decision": "approve",
  "score": 85,
  "factors": [...],
  "suggestBlockCard": false
}
```

## Nokia APIs Used

| API | Purpose |
|-----|---------|
| **Location Retrieval** | Get SIM geolocation from network |
| **Location Verification** | Compare SIM location vs POS |
| **SIM Swap** | Detect recent SIM change (fraud indicator) |
| **Device Swap** | Detect recent device change (fraud indicator) |
| **KYC Match** | Verify customer data against operator records |

All APIs via [Nokia Network as Code](https://networkascode.nokia.io/) (GSMA CAMARA Open Gateway).

Open Gateway Hackathon 2026 · GSMA CAMARA
