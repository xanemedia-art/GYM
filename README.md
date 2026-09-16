# 🏋️ FitZone — Enterprise Gym Management SaaS Platform

A production-ready, full-stack Gym Management Operating System engineered for fitness centers and multi-branch gym chains in India.

Built with **Next.js 16 (App Router)**, **Supabase PostgreSQL**, **Prisma ORM**, **Tailwind CSS**, and **TypeScript**.

---

## 🌟 Key Features

### 🏢 Multi-Branch Gym Chain Architecture
* **Header Branch Switcher**: Instant switching between chain locations (Delhi, Bengaluru, Mumbai, etc.) with real-time session updates.
* **Network Hub in Settings**: Manage existing branch locations, register new branches, configure branch-specific invoice prefixes and GSTINs.

### 💳 Statutory Indian GST Invoicing & POS Billing
* **SAC 999723 Compliance**: Automated tax calculation for intra-state (9% CGST + 9% SGST) and inter-state (18% IGST).
* **Statutory FY Invoice Numbering**: Automated Indian Financial Year calculation (e.g. `FZ/26-27/0001`).
* **Multi-Tender POS**: Cash, UPI with UTR bank reference numbers, Debit/Credit Card, and Net Banking.
* **80mm Thermal Receipt Generator**: Formatted specifically for retail thermal POS printers.

### 📱 Client Self-Registration Portal
* **Dashboard Link Generator**: Generate cryptographically signed, tamper-proof invite links with configurable validity (24h, 48h, 7d).
* **1-Click WhatsApp Sharing**: Direct WhatsApp dispatch with pre-filled message.
* **Hidden Client Page (`/join/[token]`)**: Standalone, mobile-first registration portal where clients enter KYC details, pick a membership plan, review live GST calculations, and receive instant digital Member IDs.

### 🔄 Membership Plans Lifecycle
* **Version Tracking**: Editing plan duration or price automatically creates an incremented version (v1 $\rightarrow$ v2) so past invoices and active member contracts remain legally intact.
* **Plan Allocation**: One-click modal to assign subscriptions to members with custom start dates and discounts.
* **Freeze & Unfreeze Engine**: Automatically extends member expiration dates by the exact duration frozen.

### 📲 Omnichannel Communications & Biometrics
* **Automated Cron Scanner**: Daily 06:00 AM birthday wishes and expiry warning reminders (7d, 3d, 1d) via Meta WhatsApp Cloud API.
* **ESSL / ZKTeco Edge Integration**: Sliding-window deduplication engine suppressing turnstile double-swipes.
* **Forensic Audit Trail**: Immutable log of staff actions with JSON state diffs (`oldValues` vs `newValues`).

---

## 🚀 Deploying to Vercel

This repository is pre-configured for seamless zero-config deployment to **Vercel**.

### Step 1: Import Repository
Import this repository (`https://github.com/xanemedia-art/GYM.git`) in your [Vercel Dashboard](https://vercel.com/new).

### Step 2: Configure Environment Variables
Add the following environment variables in the Vercel Project Settings:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase connection pooler URL (port 5432 or 6543) | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `DIRECT_URL` | Supabase direct connection URL | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://[PROJECT-REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key | `sb_publishable_...` |
| `JWT_SECRET` | 32+ character random secret for sessions | `my-ultra-secure-random-jwt-key-2026-xyz` |
| `NEXT_PUBLIC_APP_URL` | Canonical production URL | `https://your-app.vercel.app` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID (optional in dev) | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret | `...` |
| `WHATSAPP_API_TOKEN` | Meta WhatsApp Cloud API access token | `...` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp sender phone number ID | `...` |

> [!NOTE]
> The `package.json` includes `"postinstall": "prisma generate"`, ensuring Prisma Client and Linux serverless binaries (`rhel-openssl-3.0.x`) are automatically generated during Vercel's build step.

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the template to `.env`:
```bash
cp .env.example .env
```
Fill in your database connection string and credentials.

### 3. Generate Database Schema & Seed Data
```bash
npx prisma db push
npx tsx scripts/seed-chain.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Demo Credentials:
* **Gym Owner**: `owner@fitzone.in` / `Password@123`
* **Front Desk**: `reception@fitzone.in` / `Password@123`
* **Trainer**: `trainer@fitzone.in` / `Password@123`

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:
```bash
npm test
# or
npx tsx --test tests/unit/core.test.ts
```
All 20 automated tests cover GST calculations, FY invoice formatting, biometric deduplication window, RBAC permissions matrix, Razorpay HMAC-SHA256 signature verification, email templates, and cryptographic client invite tokens.

---

## 🛡️ Security Architecture
* **Zero Secret Leakage**: Strict `.gitignore` policy preventing `.env`, database storage files, and private keys from being tracked.
* **Timing-Safe HMAC Verification**: Razorpay webhooks use `crypto.timingSafeEqual` to prevent side-channel timing attacks.
* **Tenant Isolation**: Multi-tenant queries inject `tenantId` at the ORM layer, preventing cross-tenant data access.
* **Role-Based Access Control**: Route-level and API-level permission gates on sensitive actions (refunds, plan modifications, branch additions).
