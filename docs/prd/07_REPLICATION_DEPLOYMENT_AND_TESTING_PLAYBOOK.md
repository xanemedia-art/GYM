# PRD-07: Replication, Deployment & Verification Playbook
## Be Free Fitness (BFF) — Enterprise Gym Management SaaS Platform

**Document Version:** 1.0.0  
**Scope:** Step-by-Step System Reproduction, Environment Matrix, Test Suite Verification, and Cloud Deployment  

---

### 1. Reproduction Prerequisites

To build and run an exact replica of the platform, the host system requires:
* **Node.js:** v18.18.0 or later (Node 20+ LTS recommended).
* **Package Manager:** `npm` (v10+).
* **PostgreSQL:** PostgreSQL 14, 15, or 16 (or Supabase Cloud instance, or embedded PostgreSQL).
* **Operating System:** Windows, macOS, or Linux (Ubuntu 22.04+).

---

### 2. Environment Variables Matrix

Create a `.env` file in the project root based on `.env.example`:

| Variable Name | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` | Connection pooling string for Prisma ORM. |
| `DIRECT_URL` | Yes | `postgresql://user:pass@host:5432/db` | Direct connection string for Prisma migrations. |
| `JWT_SECRET` | Yes | 32+ char random string | Secret key used for signing session cookies and invite links. |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Canonical application base URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | `https://[ref].supabase.co` | Supabase project API URL (if using Supabase Auth/Storage). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional | `sb_publishable_...` | Supabase anon key. |
| `RAZORPAY_KEY_ID` | Optional | `rzp_live_...` or `rzp_test_...`| Razorpay API Key ID (omitted in dev for simulated links). |
| `RAZORPAY_KEY_SECRET` | Optional | `...` | Razorpay API Secret for webhook verification. |
| `WHATSAPP_API_TOKEN` | Optional | `EAA...` | Meta WhatsApp Cloud API access token. |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional | `105432...` | Meta WhatsApp Cloud API registered sender number ID. |
| `CRON_SECRET` | Optional | 32+ char random string | Bearer token securing `/api/v1/cron/run` triggers. |

---

### 3. Step-by-Step Replica Construction Guide

#### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/xanemedia-art/GYM.git gym-management-saas
cd gym-management-saas
npm install
```

#### Step 2: Initialize Database Schema
Generate the Prisma Client and synchronize the relational schema to PostgreSQL:
```bash
npx prisma db push
```

#### Step 3: Populate Multi-Branch Demonstration Seed Data
Execute the comprehensive seed script creating tenants, branches (Kullu, Dehradun), plans, members, and demo staff accounts:
```bash
npx tsx scripts/seed-chain.ts
```

#### Step 4: Verify Default Demo Staff Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Gym Owner** | `owner@fitzone.in` | `Password@123` |
| **Front Desk Reception** | `reception@fitzone.in` | `Password@123` |
| **Trainer** | `trainer@fitzone.in` | `Password@123` |

#### Step 5: Start Development Server
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

### 4. Automated Verification & Quality Assurance Suite

The application includes an automated test harness covering all critical business logic, tax calculations, and cryptographic modules.

#### Run Automated Test Suite
```bash
npm test
# or
npx tsx --test tests/unit/core.test.ts
```

#### Automated Test Suite Coverage Breakdown

```text
✔ 1. Indian GST Calculation Engine (SAC 999723)
  ✔ Calculates intra-state 18% GST (9% CGST + 9% SGST) on base plan
  ✔ Calculates inter-state 18% IGST when member is outside gym state
  ✔ Handles zero base price or 100% promotional discount
✔ 2. Statutory Indian Financial Year and Invoice Numbering
  ✔ Computes correct FY for mid-year (September 2026 -> 26-27)
  ✔ Computes correct FY for pre-April date (February 2026 -> 25-26)
  ✔ Formats sequential invoice number correctly (FZ/26-27/0042)
✔ 3. ESSL Biometric Deduplication Window Engine
  ✔ Punches from same member within 5 minutes produce identical hash (duplicate suppressed)
  ✔ Punches from different members in same window produce different hashes
✔ 4. Cryptographic Password Hashing & Verification
  ✔ Hashes password and successfully verifies match
✔ 5. Role-Based Access Control (RBAC) Matrix
  ✔ Front Desk role permissions validation
  ✔ Gym Owner role permissions validation
  ✔ Module access permissions validation
✔ 6. Razorpay Webhook HMAC-SHA256 Cryptographic Verification
  ✔ Valid signature passes verification
  ✔ Tampered body fails verification
  ✔ Wrong secret or forged signature fails verification
✔ 7. Transactional Email Notification Templates
  ✔ Welcome email template includes gym details and member code
  ✔ Statutory GST Payment receipt email contains SAC code and receipt number
  ✔ Expiry warning email contains remaining days and urgency banner
✔ 8. Cryptographic Client Self-Registration Invite Tokens
  ✔ Generates and successfully verifies valid invite token
  ✔ Rejects malformed or tampered invite tokens
✔ 9. NPCI Compliant Dynamic UPI Payment URI & QR Generation
  ✔ Constructs valid static UPI VPA URI for branch standees
  ✔ Constructs dynamic UPI URI with precise amount and transaction note
  ✔ Generates valid base64 PNG data URL for UPI QR
✔ 10. High-Speed Kiosk Cryptographic Deduplication
  ✔ Generates identical dedupHash within 5-minute time window
  ✔ Generates distinct dedupHash across different 5-minute time windows

Total: 24 passed, 0 failed.
```

---

### 5. Production Cloud Deployment (Vercel)

This repository is optimized for zero-config serverless deployment to **Vercel**:

#### 5.1 Vercel Build Pipeline Configuration
1. Ensure `package.json` contains:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
2. Verify `prisma/schema.prisma` declares:
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "rhel-openssl-3.0.x"]
   }
   ```
   This ensures Prisma generates Linux binaries compatible with AWS Lambda / Vercel Serverless runtimes.

#### 5.2 Configure Vercel Project Environment Variables
In the Vercel Dashboard under **Settings $\rightarrow$ Environment Variables**, configure all mandatory variables specified in Section 2.

#### 5.3 Trigger Deployment
Connect the Git repository to Vercel and trigger deployment. Vercel will run `npm run build`, creating optimized standalone static pages, Edge middleware, and API serverless functions.
