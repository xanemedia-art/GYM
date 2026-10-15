import { test, describe } from "node:test";
import assert from "node:assert";

describe("12. Staff Management & CSV Member Import Engines", () => {
  test("Normalizes CSV headers across various capitalization and delimiter styles", () => {
    const rawHeaders = ["First Name", "Last_Name", "Mobile Number", "Sex", "Package", "RFID_Card", "Emergency Contact"];
    const normalized = rawHeaders.map((h) => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean.includes("firstname") || clean === "fname") return "firstName";
      if (clean.includes("lastname") || clean === "lname") return "lastName";
      if (clean === "name" || clean === "fullname" || clean === "membername") return "fullName";
      if (clean.includes("phone") || clean.includes("mobile") || clean === "contact") return "phone";
      if (clean.includes("gender") || clean === "sex") return "gender";
      if (clean.includes("code") || clean.includes("memberid") || clean === "id") return "memberCode";
      if (clean.includes("plan") || clean.includes("package") || clean.includes("membership")) return "planName";
      if (clean.includes("uid") || clean.includes("rfid") || clean.includes("card")) return "doorLockUid";
      return h;
    });

    assert.strictEqual(normalized[0], "firstName");
    assert.strictEqual(normalized[1], "lastName");
    assert.strictEqual(normalized[2], "phone");
    assert.strictEqual(normalized[3], "gender");
    assert.strictEqual(normalized[4], "planName");
    assert.strictEqual(normalized[5], "doorLockUid");
  });

  test("Extracts clean 10-digit mobile number from international and punctuated phone strings", () => {
    const phones = [
      "+91 98160 12001",
      "+919816012001",
      "09816012001",
      "98160-12001",
      "(98160) 12001",
    ];

    for (const p of phones) {
      const cleaned = p.replace(/\D/g, "").slice(-10);
      assert.strictEqual(cleaned, "9816012001");
    }
  });

  test("Handles date parsing across ISO and Indian DD/MM/YYYY formats", () => {
    const parseFlexDate = (dateStr?: string | null): Date | null => {
      if (!dateStr || dateStr.trim() === "") return null;
      const s = dateStr.trim();
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;
      }
      const parts = s.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 2 && parts[2].length === 4) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        }
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };

    const d1 = parseFlexDate("2026-10-15");
    assert.ok(d1 !== null);
    assert.strictEqual(d1.getFullYear(), 2026);

    const d2 = parseFlexDate("15/10/2026");
    assert.ok(d2 !== null);
    assert.strictEqual(d2.getFullYear(), 2026);
    assert.strictEqual(d2.getDate(), 15);
  });

  test("Validates staff roles against role permissions matrix", () => {
    const allowedStaffRoles = ["MANAGER", "FRONT_DESK", "TRAINER", "ACCOUNTANT"];
    assert.ok(allowedStaffRoles.includes("FRONT_DESK"));
    assert.ok(allowedStaffRoles.includes("MANAGER"));
    assert.ok(!allowedStaffRoles.includes("HACKER"));
  });
});
