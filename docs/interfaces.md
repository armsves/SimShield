# SimShield System Interfaces

This document outlines the interfaces between the SimShield Frontend (Next.js) and the Backend Services (Telegram Chatbot / FastAPI).

## 1. Payment Validation Interface (Internal API)

**Status:** ✅ Fully Implemented (Functional Sandbox/Production)

The frontend calls this endpoint to orchestrate Nokia network signals and calculate a risk score.

*   **Endpoint:** `POST /api/validate-payment`
*   **Source Code:** `src/app/api/validate-payment/route.ts`
*   **Implementation Detail:** Uses `src/lib/validator.ts`. Defaults to **Sandbox Mode** if `NOKIA_RAPID_API_KEY` is not set, providing deterministic mock data for testing.

### Request Payload
```json
{
  "phoneNumber": "string",     // Format: +34XXXXXXXXX
  "posLatitude": number,       // POS location latitude
  "posLongitude": number,      // POS location longitude
  "amountCents": number,       // Transaction amount in cents
  "kycData": {                 // Optional: for KYC Match API
    "idDocument": "string",
    "name": "string",
    "address": "string",
    "birthdate": "string"
  }
}
```

### Response Payload
```json
{
  "decision": "approve" | "deny" | "clarify",
  "score": number,             // 0-100 (Risk confidence)
  "factors": [
    {
      "name": "string",        // e.g., "sim_swap_detected"
      "impact": "positive" | "negative",
      "description": "string"  // Human-readable reason
    }
  ],
  "suggestBlockCard": boolean,
  "apiTimings": [
    { "api": "string", "ms": number }
  ]
}
```

---

## 2. Incident Management Interface (Backend API)

**Status:** ⚠️ Frontend Mocked / Backend Implemented

When a transaction is denied or requires clarification, the frontend is designed to interface with the Telegram Chatbot backend.

### A. Trigger Security Incident
Initiates a proactive security check by sending a message to the user via Telegram.

*   **Endpoint:** `POST /api/denial/submit` (Frontend Proxy) -> `POST /api/v1/trigger-alert` (Backend)
*   **Logic:** Maps the `phone_number` to a `telegram_id` in Firestore and starts an LLM-driven conversation.
*   **Frontend Proxy:** `src/app/api/denial/submit/route.ts` (**MOCKED**: Returns a base64 ID with encoded resolve time)
*   **Backend Target:** `POST /api/v1/trigger-alert` (**✅ IMPLEMENTED**: In `main.py`)

**Request Payload:**
```json
{
  "phone_number": "string",
  "alert_type": "PAYMENT_DENIAL" | "SIM_SWAP_DETECTED",
  "severity": "high",
  "amountCents": number,
  "posLatitude": number,
  "posLongitude": number
}
```

### B. Incident Status Polling

**Status:** ⚠️ Frontend Mocked / Backend Implemented

Used by the POS/Frontend to check if the user has verified themselves through the chatbot.

*   **Endpoint:** `POST /api/denial/status` (Frontend Proxy) -> `GET /api/v1/incident-status/{phone_number}` (Backend)
*   **Frontend Proxy:** `src/app/api/denial/status/route.ts` (**MOCKED**: Decodes the base64 ID to simulate polling delay)
*   **Backend Target:** `GET /api/v1/incident-status/{phone_number}` (**✅ IMPLEMENTED**: In `main.py`)


**Response Payload:**
```json
{
  "status": "pending" | "resolved" | "escalated",
  "approved": boolean,         // Whether the user/agent overturned the denial
  "last_update": "ISO8601",
  "summary": "string"          // AI-generated summary of the resolution
}
```

---

## 3. Scoring Logic & Thresholds

The `src/lib/scoring/engine.ts` uses the following thresholds:

*   **Approve:** Score $\ge 70$
*   **Clarify (Escalate):** Score $40 \le x < 70$
*   **Deny:** Score $< 40$

### Primary Risk Signals
1.  **Location Match:** Is the SIM card near the POS terminal? (Strongest weight)
2.  **SIM Swap:** Has the SIM card been replaced in the last 7 days? (Critical weight)
3.  **Device Swap:** Has the physical device changed recently? (Medium weight)
4.  **KYC Match:** Does the provided customer data match the telco record? (Verification weight)
