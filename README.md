# SimShield

Payment validation for physical POS using Nokia Network as Code APIs. Validates transactions by comparing the customer's SIM location with the POS location, checking for SIM/device swaps, and scoring risk before processing payment.

## Tech Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Serverless APIs** for validation
- **Nokia Network as Code** – Location Retrieval, Location Verification, SIM Swap, Device Swap

## Flow

1. **POS** collects: customer phone, amount, POS location
2. **Validate** → Serverless API calls Nokia APIs
3. **Score** computed from:
   - SIM location vs POS (strongest signal)
   - Recent SIM swap
   - Recent device swap
   - API availability
4. **Decision**:
   - **Approve** (score ≥ 70) → Process payment
   - **Clarify** (40–69) → Telegram LLM chatbot contacts customer (to be implemented)
   - **Deny** (< 40) → Reject; optionally suggest card block

## Setup

```bash
npm install
cp .env.example .env
# Add NOKIA_API_TOKEN from https://developer.networkascode.nokia.io/
npm run dev
```

Without `NOKIA_API_TOKEN`, the app runs in **sandbox mode** with mock Nokia responses.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── validate-payment/route.ts   # POST – main validation API
│   │   └── health/route.ts             # GET – health check
│   ├── layout.tsx
│   ├── page.tsx                        # POS UI
│   └── globals.css
├── lib/
│   ├── nokia/                          # Nokia API client
│   │   ├── client.ts
│   │   ├── location.ts
│   │   ├── sim-swap.ts
│   │   ├── device-swap.ts
│   │   └── types.ts
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
  "transactionId": "optional"
}
```

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
| Location Retrieval | Get SIM geolocation from network |
| Location Verification | Compare SIM location vs POS |
| SIM Swap | Detect recent SIM change |
| Device Swap | Detect recent device change |

Open Gateway Hackathon 2026 · GSMA CAMARA
