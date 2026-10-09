# PRD-05: REST API Specification
## Be Free Fitness (BFF) — Enterprise Gym Management SaaS Platform

**Document Version:** 1.0.0  
**Scope:** Complete REST API Contracts, Payload Formats, Query Parameters, and Response Envelopes  

---

### 1. Global API Standards & Envelope Conventions

All API endpoints follow standardized REST JSON response envelopes generated via `src/lib/api-response.ts`:

#### Success Envelope (`apiSuccess`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 124
  }
}
```

#### Error Envelope (`apiError`)
```json
{
  "success": false,
  "error": {
    "message": "Human-readable explanation of error",
    "code": "VALIDATION_ERROR | AUTH_FAILED | RATE_LIMITED | NOT_FOUND | SERVER_ERROR",
    "details": { ... }
  }
}
```

#### Standard HTTP Status Codes
* `200 OK`: Request succeeded.
* `201 Created`: Resource successfully created.
* `400 Bad Request`: Zod payload validation failure or missing mandatory parameter.
* `401 Unauthorized`: Missing or invalid session JWT cookie.
* `403 Forbidden`: Insufficient role permissions for requested action.
* `404 Not Found`: Entity not found within the tenant scope.
* `429 Too Many Requests`: Rate limiter triggered.
* `500 Internal Server Error`: Unhandled database or system exception.

---

### 2. Authentication & Session Endpoints

#### `POST /api/v1/auth/login`
* **Auth Required:** No (Public).
* **Rate Limit:** 5 requests / 60 seconds (IP & Email).
* **Request Body:**
  ```json
  {
    "email": "owner@fitzone.in",
    "password": "Password@123",
    "tenantSlug": "optional-slug"
  }
  ```
* **Success Response (200):** Sets HTTP-only `gms_session` cookie and returns user profile.

#### `POST /api/v1/auth/logout`
* **Auth Required:** Yes.
* **Behavior:** Clears `gms_session` cookie by setting expiration to `new Date(0)`.

#### `GET /api/v1/auth/me`
* **Auth Required:** Yes.
* **Success Response (200):** Returns authenticated user identity, role, permissions list, and tenant object.

#### `POST /api/v1/auth/switch-gym`
* **Auth Required:** Yes (`GYM_OWNER` or `SUPER_ADMIN`).
* **Request Body:** `{ "targetTenantId": "uuid" }`
* **Behavior:** Issues updated JWT session cookie scoped to `targetTenantId`.

---

### 3. Member Master Directory Endpoints

#### `GET /api/v1/members`
* **Auth Required:** Yes (`MEMBER_ONBOARDING` or `VIEW_ASSIGNED_MEMBERS`).
* **Query Parameters:**
  * `query`: Search string matching first name, last name, phone, or member code.
  * `status`: Filter by `MemberStatus` (`ACTIVE`, `EXPIRED`, etc.).
  * `trainerId`: Filter members assigned to specific trainer.
  * `page` (default 1), `limit` (default 50).
* **Success Response (200):** Array of member profiles with active membership summary.

#### `POST /api/v1/members`
* **Auth Required:** Yes (`MEMBER_ONBOARDING`).
* **Request Body:**
  ```json
  {
    "firstName": "Rohan",
    "lastName": "Kapoor",
    "gender": "MALE",
    "phone": "9876543210",
    "email": "rohan@gmail.com",
    "dateOfBirth": "1996-05-14",
    "emergencyContactName": "Anita Kapoor",
    "emergencyContactPhone": "9876543211",
    "assignedTrainerId": "uuid-optional",
    "planId": "uuid-optional",
    "planStartDate": "2026-10-01"
  }
  ```
* **Success Response (201):** Newly created member record with auto-generated `memberCode`.

#### `GET /api/v1/members/[id]`
* **Auth Required:** Yes.
* **Success Response (200):** Full member master file including memberships, attendance records, invoices, and KYC data.

#### `PUT /api/v1/members/[id]`
* **Auth Required:** Yes (`MEMBER_ONBOARDING`).
* **Request Body:** Partial member updates (phone, address, emergency contact, health metrics, custom fields).

#### `DELETE /api/v1/members/[id]`
* **Auth Required:** Yes (`GYM_OWNER`).
* **Behavior:** Sets `isDeleted = true` (soft deletion) to preserve audit trails.

---

### 4. Memberships & Plans Endpoints

#### `GET /api/v1/plans`
* **Auth Required:** Yes.
* **Success Response (200):** List of all membership plans and latest active versions.

#### `POST /api/v1/plans`
* **Auth Required:** Yes (`MANAGE_PLANS`).
* **Request Body:**
  ```json
  {
    "name": "Annual Platinum All-Access",
    "description": "Full access to all 6 branches",
    "durationDays": 365,
    "joiningFee": 1000.00,
    "basePrice": 18000.00
  }
  ```

#### `PUT /api/v1/plans/[id]`
* **Auth Required:** Yes (`MANAGE_PLANS`).
* **Behavior:** Increments `versionNumber` in `membership_plan_versions` to ensure existing member subscriptions remain unmodified.

#### `POST /api/v1/memberships`
* **Auth Required:** Yes (`MEMBER_ONBOARDING`).
* **Request Body:** Assigns a plan version to a member with custom start date, discount, and assigned trainer.

#### `PUT /api/v1/memberships/[id]` (Freeze / Unfreeze)
* **Auth Required:** Yes (`FREEZE_CANCEL_MEMBERSHIP`).
* **Request Body:**
  ```json
  {
    "action": "FREEZE | UNFREEZE",
    "freezeStartDate": "2026-10-15",
    "reason": "Medical surgery recovery"
  }
  ```
* **Behavior:** Updates membership status and dynamically recalculates `endDate` upon unfreezing.

---

### 5. Invoicing, POS Billing & Payments Endpoints

#### `GET /api/v1/invoices`
* **Auth Required:** Yes (`COLLECT_PAYMENTS` or `VIEW_FINANCIAL_REPORTS`).
* **Query Parameters:** `memberId`, `status`, `startDate`, `endDate`, `page`, `limit`.

#### `POST /api/v1/invoices`
* **Auth Required:** Yes (`COLLECT_PAYMENTS`).
* **Request Body:**
  ```json
  {
    "memberId": "uuid",
    "membershipId": "uuid-optional",
    "items": [
      {
        "description": "Annual Strength Plan",
        "hsnSacCode": "999723",
        "quantity": 1,
        "unitPrice": 10000.00
      }
    ],
    "discountAmount": 1000.00,
    "isInterState": false,
    "payment": {
      "mode": "UPI",
      "amount": 10620.00,
      "referenceNumber": "UPI-UTR-998877"
    }
  }
  ```
* **Success Response (201):** Generates official FY invoice (e.g. `FZ/26-27/0042`) with 9% CGST + 9% SGST breakdown.

#### `POST /api/v1/payments/generate-link`
* **Auth Required:** Yes (`COLLECT_PAYMENTS`).
* **Request Body:** `{ "invoiceId": "uuid" }`
* **Success Response (200):** Dispatches request to Razorpay and returns `{ short_url: "https://rzp.io/i/..." }`.

---

### 6. Attendance & Biometric Endpoints

#### `POST /api/v1/attendance/manual`
* **Auth Required:** Yes (`MANUAL_ATTENDANCE`).
* **Request Body:** `{ "memberId": "uuid", "punchType": "CHECK_IN | CHECK_OUT" }`

#### `GET /api/v1/attendance/today`
* **Auth Required:** Yes.
* **Success Response (200):** Real-time list of today's check-ins, timestamps, and current active occupancy count.

#### `POST /api/v1/attendance/client-punch`
* **Auth Required:** No (Protected by 15 req/60s IP rate limit).
* **Request Body:**
  ```json
  {
    "tenantSlug": "dhalpur-kullu",
    "identifier": "9876543210",
    "punchType": "CHECK_IN"
  }
  ```
* **Behavior:** Checks active membership, applies 5-minute sliding window dedup hash, masks member surname for privacy, and logs punch.

#### `POST /api/v1/attendance/kiosk-punch`
* **Auth Required:** Yes (Kiosk Session).
* **Behavior:** Front-desk rapid punch with immediate full member profile return.

---

### 7. Hardware Edge Integration Endpoints (`/integrations/essl/*`)

#### `POST /api/v1/integrations/essl/punches`
* **Auth Required:** Device API Key in `Authorization: Bearer <API_KEY>` or `x-device-serial`.
* **Request Body:**
  ```json
  {
    "deviceSerial": "ESSL-DELHI-01",
    "punches": [
      {
        "deviceEnrollmentId": 1042,
        "punchTime": "2026-10-07T08:30:00Z",
        "verificationMode": "FINGERPRINT"
      }
    ]
  }
  ```
* **Behavior:** Maps enrollment ID to member, suppresses 5-minute duplicates, and ingests batch punches.

#### `GET /api/v1/integrations/essl/recent-swipes`
* **Auth Required:** Yes (`CONFIGURE_DEVICES`).
* **Success Response (200):** Returns array of unassigned card/finger swipes from memory buffer.

#### `POST /api/v1/integrations/essl/assign-uid`
* **Auth Required:** Yes (`CONFIGURE_DEVICES`).
* **Request Body:** `{ "memberId": "uuid", "uid": "CARD_HEX_12345" }`
* **Behavior:** Associates UID with `Member.customFields` and creates `DeviceUser` entry.

---

### 8. Invites & Public Self-Registration Endpoints

#### `POST /api/v1/invites`
* **Auth Required:** Yes (`MEMBER_ONBOARDING`).
* **Request Body:** `{ "clientName": "Rohit", "clientPhone": "9876543210", "expiresInHours": 48 }`
* **Success Response (200):** Returns cryptographically signed token and WhatsApp dispatch link.

#### `POST /api/v1/public/self-register`
* **Auth Required:** Valid Client Invite Token.
* **Request Body:** Personal details, emergency contact, selected plan ID.
* **Success Response (201):** Onboards member and returns digital membership pass.

---

### 9. Automation & Webhooks Endpoints

#### `POST /api/v1/cron/run`
* **Auth Required:** Cron Secret Header (`Authorization: Bearer <CRON_SECRET>`).
* **Behavior:** Executes morning 06:00 AM automation (birthdays, 7/3/1 day expiry WhatsApp alerts, membership status updates).

#### `POST /api/v1/webhooks/razorpay`
* **Auth Required:** Valid HMAC-SHA256 signature in `x-razorpay-signature`.
* **Behavior:** Verifies payload in constant time, marks invoice `PAID`, logs payment, and triggers confirmation email.
