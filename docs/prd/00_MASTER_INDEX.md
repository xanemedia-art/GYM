# Be Free Fitness (BFF) — Enterprise Gym Management SaaS
## Master Product Requirements Document (PRD) Suite Index

**Document Version:** 1.0.0  
**Status:** Approved for Implementation / Exact Replica Construction  
**Target Platform:** Next.js 16 (App Router), React 19, TypeScript, Prisma ORM 6, PostgreSQL, Tailwind CSS v4  
**Target Deployment:** Vercel (Serverless Cloud) + Windows Service On-Premise Edge Daemon (`GymSync`)  

---

### Executive Purpose
This document suite defines the exhaustive, end-to-end technical and functional specifications required to construct a pixel-perfect, feature-complete, and architecture-identical replica of the **Be Free Fitness (BFF) Enterprise Gym Management SaaS Platform**.

Every data model, calculation formula, cryptographic protocol, API endpoint, UI state machine, and hardware communication flow in this suite is derived directly from the production implementation.

---

### PRD Suite Structure & Navigation

| Document Code | Document Title | Primary Scope & Coverage |
| :--- | :--- | :--- |
| **[PRD-01](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/01_PRODUCT_OVERVIEW_AND_ARCHITECTURE.md)** | **Product Overview & Architecture** | Vision, dual-portal architecture, tech stack specifications, multi-tenancy isolation model, topology diagram. |
| **[PRD-02](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/02_DATA_MODEL_AND_DATABASE_SCHEMA.md)** | **Database Schema & Data Dictionary** | Exhaustive Prisma schema, 14 models, 8 enums, foreign key cascading, JSON schemas, indexing strategies. |
| **[PRD-03](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/03_RBAC_SECURITY_AND_AUTHENTICATION.md)** | **Security, Authentication & RBAC** | JWT session cookies, dummy bcrypt timing attack mitigations, rate limiting, 6-role permission matrix, webhook verification. |
| **[PRD-04](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/04_FUNCTIONAL_MODULES_SPECIFICATIONS.md)** | **Core Functional Modules Specifications** | Comprehensive specs for all 9 core functional subsystems (GST POS, Member KYC, Attendance, Kiosk, Cron, etc.). |
| **[PRD-05](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/05_REST_API_SPECIFICATION.md)** | **REST API Contracts & Endpoints** | Exact JSON schemas, Zod validations, query parameters, status codes, and error formats for all 21+ routes. |
| **[PRD-06](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/06_HARDWARE_EDGE_AGENT_SPECIFICATION.md)** | **Hardware Edge Agent (`GymSync`)** | eSSL / ZKTeco biometric integration, ZK TCP/UDP 4370 protocol, offline ring buffer, Windows Service deployment. |
| **[PRD-07](file:///c:/Users/94591/.gemini/antigravity-ide/scratch/gym-management-saas/docs/prd/07_REPLICATION_DEPLOYMENT_AND_TESTING_PLAYBOOK.md)** | **Deployment, Replication & Testing Playbook** | Environment variables, database migrations, seed data, automated test suite (20 tests), Vercel deployment. |

---

### Global Terminology & Definitions

* **Tenant:** An individual fitness enterprise or a multi-branch gym organization possessing isolated member, billing, and device domains.
* **SAC Code 999723:** Indian Goods & Services Tax (GST) Services Accounting Code designating "Gymnastic and physical fitness services", attracting 18% statutory tax.
* **FY (Financial Year):** Indian statutory fiscal cycle extending from April 1st of year $N$ to March 31st of year $N+1$ (e.g., `26-27`).
* **Sliding-Window Dedup Hash:** Cryptographic SHA-256 fingerprint suppressing repeated card/finger biometric turnstile double-swipes within a configurable time window (default 5 minutes).
* **GymSync:** Standalone on-premise background daemon bridging local LAN biometric turnstiles with the cloud platform.
* **Client Self-Registration Token:** Cryptographically signed HS256 JWT token permitting secure, zero-login mobile onboarding.
