# PRD-04: Functional Modules Specification
## Be Free Fitness (BFF) — Enterprise Gym Management SaaS Platform

**Document Version:** 1.0.0  
**Scope:** Functional Requirements, UI State Machines, Business Logic Algorithms, and Interaction Flows  

---

### Module 1: Public Brand Website & Headless CMS

#### 1.1 Scope & Routes
* **Routes:** `/` (Brand Home), `/locations` (Branch Directory), `/locations/[slug]` (Branch Detail), `/about` (Heritage & Philosophy), `/contact` (Direct Contact & Helpdesk), `/franchise` (Franchise Partner Inquiry), `/website-cms` (Staff CMS Dashboard).

#### 1.2 Public UI Features & User Interactions
1. **Dynamic Region Filtering:** Branch selector allows visitors to toggle between `"ALL"`, `"Kullu Valley"`, and `"Dehradun"` regions.
2. **Branch Showcase Cards:** Cards display high-resolution imagery, floor square footage, establishment year, operating hours, amenities badges, and direct links to Google Maps and branch detail pages.
3. **Branch Detail Experience (`/locations/[slug]`):**
   * High-definition photo gallery slider.
   * Head Trainer bio card with qualifications and specialization badges.
   * Equipment arsenal inventory (Hammer Strength, Eleiko Olympic bars, Concept2 rowers).
   * Interactive branch-specific contact card with click-to-call and WhatsApp deep links.
4. **Lead Generation Modals:**
   * **Book a Tour Modal:** Collects Name, Phone, Target Branch, and Preferred Date/Time. Dispatches lead to `/api/v1/public/book-link`.
   * **Inquire Now Modal:** Collects general inquiries, preferred training goals, and redirects directly to WhatsApp with pre-filled branch message.
   * **Franchise Form:** Captures prospective partner net worth, target city, and commercial space details.
5. **Headless CMS Engine (`/website-cms`):**
   * Authenticated staff can edit hero headlines, promotional badges, branch descriptions, and equipment highlights in real time.
   * Data persists in JSON format (`src/data/website-content.json` or database) and hydrates public pages dynamically via `/api/v1/website-content`.

---

### Module 2: Staff Console, Multi-Branch Hub & Navigation

#### 2.1 Scope & Routes
* **Routes:** `/portal` (Operations Dashboard), `/settings` (Enterprise & Branch Settings).

#### 2.2 Functional Capabilities
1. **Header Branch Switcher:** Dropdown in the top navigation bar displays all active branches. Switching branches updates `tenantId` in the session cookie, refreshing the UI context instantly.
2. **Real-Time Key Performance Indicators (KPIs):**
   * Today's Check-ins & Active Floor Occupancy.
   * Monthly New Member Signups.
   * Month-to-Date Gross Revenue (Taxable + GST).
   * Members Expiring within 7 Days.
3. **Quick Action Dock:** One-click shortcuts for New Member Registration, Quick POS Bill, Manual Attendance Check-in, and WhatsApp Invite Link Generation.

---

### Module 3: Member Directory & KYC Management

#### 3.1 Scope & Routes
* **Routes:** `/members` (Directory Table & Filters), `/members/[id]` (Member Master File).

#### 3.2 Member Data Model & Lifecycle
* **Member Code Generator:** Automatically generates sequential identifiers formatted as `{PREFIX}-{SEQUENCE}` (e.g. `FZ-1001`, `BFF-1042`).
* **Member Status States:** `LEAD` $\rightarrow$ `ACTIVE` $\rightarrow$ `EXPIRING_SOON` $\rightarrow$ `EXPIRED` $\rightarrow$ `FROZEN` $\rightarrow$ `SUSPENDED` $\rightarrow$ `CANCELLED`.

#### 3.3 Member Master Detail Tabs (`/members/[id]`)
1. **Overview Tab:** Contact details, emergency contact info, assigned personal trainer, and membership status badge.
2. **Memberships Tab:** History of active and expired subscription contracts, plan versions, start/end dates, and one-click Pause/Freeze trigger.
3. **Attendance Tab:** Chronological log of all check-in punches, verification mode (`FINGERPRINT`, `RFID_CARD`, `KIOSK`, `MANUAL`), and timestamp.
4. **Invoices & Billing Tab:** Historical GST tax invoices, payment mode records, balance amounts, and printable receipt download buttons.
5. **KYC & Health Metrics Tab:** Dynamic JSON editor for height, weight, BMI, blood group, medical history, and custom RFID door lock UID mappings.

---

### Module 4: Membership Plans & Versioned Lifecycle Engine

#### 4.1 Scope & Routes
* **Routes:** `/plans` (Catalog & Subscription Assignment).

#### 4.2 Immutable Plan Versioning Engine
* To ensure past GST invoices and active legal member contracts remain immutable when gym pricing or durations change:
  1. Editing a plan never modifies the existing database row in place.
  2. The system increments `versionNumber` (e.g. $v1 \rightarrow v2$) inside `membership_plan_versions`.
  3. All new subscriptions link to the latest version, while past subscriptions remain tied to their historic version.

#### 4.3 Subscription Freeze & Unfreeze Engine
* **Freeze Trigger:** Staff specifies a `freezeStartDate`, optional `freezeEndDate`, and reason.
* **Status Update:** `Member.status` transitions to `FROZEN`.
* **Automatic Extension Algorithm:**
  When a membership is unfrozen, the system computes the exact duration in days:
  $$\Delta t = \text{UnfrozenDate} - \text{FreezeStartDate}$$
  $$\text{NewEndDate} = \text{CurrentEndDate} + \Delta t$$
  $$\text{frozenDaysTotal} = \text{frozenDaysTotal} + \Delta t$$
* The membership expiration date extends automatically, maintaining fair value for the member.

---

### Module 5: Statutory Indian GST Invoicing & POS Billing Engine

#### 5.1 Scope & Routes
* **Routes:** `/billing` (Invoices, Receipts & POS Terminal).

#### 5.2 Statutory GST Calculation Algorithm (SAC 999723)
* **HSN/SAC Code:** `999723` (Gymnastic and physical fitness center services).
* **Tax Calculation Rules:**
  $$\text{TaxableAmount} = \max(0, \text{BasePrice} - \text{DiscountAmount})$$
  * **Intra-State Transaction** (Member in same state as gym, e.g. Himachal Pradesh $\rightarrow$ HP):
    $$\text{CGST} = \text{TaxableAmount} \times 9\% = \text{TaxableAmount} \times 0.09$$
    $$\text{SGST} = \text{TaxableAmount} \times 9\% = \text{TaxableAmount} \times 0.09$$
    $$\text{IGST} = 0$$
    $$\text{TotalInvoiceAmount} = \text{TaxableAmount} + \text{CGST} + \text{SGST}$$
  * **Inter-State Transaction** (Member in different state, e.g. Punjab $\rightarrow$ HP):
    $$\text{CGST} = 0, \quad \text{SGST} = 0$$
    $$\text{IGST} = \text{TaxableAmount} \times 18\% = \text{TaxableAmount} \times 0.18$$
    $$\text{TotalInvoiceAmount} = \text{TaxableAmount} + \text{IGST}$$

#### 5.3 Statutory Indian Financial Year Sequential Numbering
* Indian Financial Years span April 1st to March 31st:
  * For dates in April–December: FY is `Year` to `Year+1` (e.g. Sept 2026 $\rightarrow$ `26-27`).
  * For dates in January–March: FY is `Year-1` to `Year` (e.g. Feb 2026 $\rightarrow$ `25-26`).
* **Sequential Number Format:** `{PREFIX}/{FY}/{PADDED_SEQUENCE}` (e.g. `FZ/26-27/0042`).
* When configured, sequence numbers reset to `0001` on April 1st.

#### 5.4 Multi-Tender POS & 80mm Thermal Receipt Generator
* **Accepted Tenders:** Cash, UPI (with mandatory or optional UTR Bank Reference Number), Credit/Debit Card, Net Banking.
* **Thermal Printing:** Specialized CSS print stylesheet (`@media print`) rendering high-contrast 80mm receipts optimized for Epson/Star thermal POS printers, featuring gym GSTIN, SAC code, tax breakdown, and UPI transaction notes.

---

### Module 6: NPCI Dynamic UPI QR & Payment Gateway Engine

#### 6.1 NPCI UPI Deep Link Protocol (`buildUpiUri`)
Generates standardized UPI intent URLs conforming to NPCI technical guidelines:
```text
upi://pay?pa={UPI_ID}&pn={MERCHANT_NAME}&am={AMOUNT}&cu=INR&tn={INVOICE_NUMBER}
```
* **Static Standee Mode:** Omit `am` and `tn` to generate static counter standee QR codes.
* **Dynamic POS Mode:** Inject precise bill amount (`am=4999.00`) and invoice note (`tn=FZ%2F26-27%2F0104`) allowing members to scan and pay without typing amounts.

#### 6.2 Razorpay Payment Link & Webhook Engine
* **Payment Link Generation:** Dispatches REST requests to `https://api.razorpay.com/v1/payment_links` with customer phone and email. In development environments without live credentials, generates deterministic simulated links (`plink_sim_*`).
* **Webhook Ingestion (`/api/v1/webhooks/razorpay`):** Verifies `x-razorpay-signature` using timing-safe HMAC-SHA256, identifies invoice, updates status to `PAID`, records a `Payment` entity, and triggers transactional WhatsApp/Email confirmation.

---

### Module 7: Biometric Hardware & Attendance Engine

#### 7.1 Scope & Routes
* **Routes:** `/attendance` (Live Logs & Overrides), `/devices` (Terminal Inventory), `/kiosk` (Front Desk Rapid Terminal), `/punch/[slug]` (Member Tablet Check-in).

#### 7.2 Cryptographic Sliding-Window Deduplication Algorithm
To suppress accidental turnstile double-swipes or rapid button taps:
1. Capture event timestamp $T$ in milliseconds.
2. Group into a 5-minute bucket:
   $$\text{Bucket} = \left\lfloor \frac{T}{5 \times 60 \times 1000} \right\rfloor$$
3. Compute SHA-256 fingerprint:
   $$\text{DedupHash} = \text{SHA256}(\text{TenantId} + \text{MemberId} + \text{Bucket})$$
4. If a record with `[tenantId, dedupHash]` already exists in `attendance_records`, suppress the duplicate punch and return status `ALREADY_CHECKED_IN` without database error.

#### 7.3 Live Door Lock Swipe Buffer & RFID Mapping
* Unassigned card swipes captured by hardware are stored in a 30-item memory ring buffer via `recordDoorLockSwipe`.
* Reception staff can view unassigned swipes in real time on `/devices` or member profile pages and click **"Assign to Member"** to instantly pair the RFID card with `Member.customFields.doorLockUid`.

#### 7.4 High-Speed Front-Desk Kiosk (`/kiosk`)
* Designed for reception touchscreens with numerical keypad input, barcode scanner USB emulation support, and full-screen biometric feedback.
* Displays member photo, active subscription badge, remaining days, and door access authorization status.

---

### Module 8: Client Self-Registration Portal (`/join/[token]`)

#### 8.1 Functional Flow
1. Reception staff enters prospect name and phone in the dashboard link generator.
2. System signs an HS256 JWT containing `{ tenantId, gymName, clientName, clientPhone }` with configurable 24h, 48h, or 7d expiration.
3. Reception staff clicks **"Share on WhatsApp"**, opening a pre-filled WhatsApp message.
4. Member opens `/join/[token]` on their smartphone:
   * **Step 1:** Verifies pre-filled name and phone; enters emergency contact, gender, and DOB.
   * **Step 2:** Selects desired membership pass with real-time tax breakdown.
   * **Step 3:** Reviews bill summary and submits registration.
   * **Step 4:** System provisions member account, generates Member Code, records invoice, and presents a digital pass.

---

### Module 9: Omnichannel Communications & Cron Automation Engine

#### 9.1 Daily 06:00 AM IST Cron Automation (`/api/v1/cron/run`)
Automated scheduled task executing every morning:
1. **Birthday Greetings Scanner:**
   * Queries active members whose `date_of_birth` (month and day) matches today.
   * Dispatches personalized Meta WhatsApp Cloud API template `member_birthday_wish`.
2. **Renewal Expiry Reminders:**
   * Scans active memberships expiring in exactly 7 days, 3 days, and 1 day.
   * Sends urgent renewal reminder WhatsApp template `membership_expiry_reminder` with direct renewal link.
3. **Automated Status Transition:**
   * Locates memberships where `endDate < Today` and updates `status` to `EXPIRED`.
   * If member has no other active memberships, transitions `Member.status` to `EXPIRED`.

#### 9.2 Forensic Audit Trail (`/audit-logs`)
* Every administrative mutation (member profile edits, plan price revisions, payment deletions, attendance overrides) creates an immutable `AuditLog` row capturing:
  * `userId`, `action`, `entityType`, `entityId`, `ipAddress`, `userAgent`.
  * `oldValues` vs `newValues` JSON state diffs for post-incident audits.
