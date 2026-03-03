Based on my investigation of the frontend code and the backend design documentation, here is the interface used by the frontend to communicate with the mocked API.

### 1. Payment Validation Interface
The frontend calls this internal endpoint to orchestrate Nokia APIs and the scoring engine.

*   **Endpoint:** `POST /api/validate-payment`
*   **Request Body:**
    ```json
    {
      "phoneNumber": "+1234567890",
      "posLatitude": 41.3851,
      "posLongitude": 2.1734,
      "amountCents": 1000,
      "kycData": { 
        "idDocument": "ABC123456" 
      } // Optional
    }
    ```
*   **Response Body:**
    ```json
    {
      "decision": "approve" | "deny" | "clarify",
      "score": number, // 0-100
      "factors": [
        { "name": "string", "impact": "positive" | "negative", "description": "string" }
      ],
      "suggestBlockCard": boolean,
      "apiTimings": [
        { "api": "sim_swap", "ms": number }
      ]
    }
    ```

---

### 2. Incident Management Interface (Chatbot API)
When the validation results in a `deny` (or potentially `clarify`), the frontend interacts with the `telegram-chatbot` backend through these endpoints.

#### A. Trigger Incident / Submit Case
Initiates a proactive security check via the Telegram bot.
*   **Endpoint:** `POST /api/denial/submit` (Frontend) $
ightarrow$ calls `POST /api/v1/trigger-alert` (Backend)
*   **Request Body:**
    ```json
    {
      "phone_number": "+1234567890",
      "alert_type": "PAYMENT_DENIAL",
      "severity": "high",
      "amountCents": 1000, // Optional context
      "posLatitude": 41.3851,
      "posLongitude": 2.1734
    }
    ```
*   **Response Body:**
    ```json
    { "id": "+1234567890" }
    ```

#### B. Poll Incident Status
Checks if the user has resolved the incident via the Telegram conversation.
*   **Endpoint:** `POST /api/denial/status` (Frontend) $
ightarrow$ calls `GET /api/v1/incident-status/{phone_number}` (Backend)
*   **Response Body:**
    ```json
    {
      "status": "pending" | "resolved" | "escalated",
      "approved": boolean, // Frontend expects this to decide if it should overturn the denial
      "last_update": "2026-03-03T10:00:00Z",
      "summary": "User confirmed transaction via Telegram."
    }
    ```

### Key Logic Observations
*   **Thresholds:** Decisions are driven by a score: `approve` ($\ge 70$), `clarify` ($40	ext{--}70$), and `deny` ($< 40$).
*   **State Mapping:** The `denial/submit` mock currently encodes the resolution time and result in a base64 ID, which you'll likely want to replace with a real Firestore document lookup in your backend.
*   **User Identification:** The `phone_number` serves as the primary key for mapping frontend requests to Telegram users in the `users` and `incidents` collections.
