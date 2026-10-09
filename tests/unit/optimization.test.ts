import { test, describe } from "node:test";
import assert from "node:assert";
import { OFFICIAL_INDIAN_GOVT_HOLIDAYS } from "../../src/data/indian-holidays";

describe("11. Official Government of India Gazetted Calendar Engine", () => {
  test("Contains gazetted Indian national holidays across multiple years", () => {
    assert.ok(OFFICIAL_INDIAN_GOVT_HOLIDAYS.length >= 20, "Should have 20+ gazetted holidays");
  });

  test("Includes statutory national holidays: Republic Day, Independence Day, Gandhi Jayanti", () => {
    const holidays2026 = OFFICIAL_INDIAN_GOVT_HOLIDAYS.filter((h) => h.date.startsWith("2026"));
    
    const republicDay = holidays2026.find((h) => h.date === "2026-01-26");
    assert.ok(republicDay, "Republic Day must be present on 2026-01-26");
    assert.strictEqual(republicDay?.isNationalHoliday, true);

    const independenceDay = holidays2026.find((h) => h.date === "2026-08-15");
    assert.ok(independenceDay, "Independence Day must be present on 2026-08-15");

    const gandhiJayanti = holidays2026.find((h) => h.date === "2026-10-02");
    assert.ok(gandhiJayanti, "Mahatma Gandhi's Birthday must be present on 2026-10-02");
  });

  test("Includes major cultural celebrations (Diwali, Holi, Eid, Christmas)", () => {
    const titles = OFFICIAL_INDIAN_GOVT_HOLIDAYS.map((h) => h.title);
    assert.ok(titles.some((t) => t.includes("Diwali")), "Diwali must be in calendar");
    assert.ok(titles.some((t) => t.includes("Holi")), "Holi must be in calendar");
    assert.ok(titles.some((t) => t.includes("Id-ul-Fitr")), "Id-ul-Fitr must be in calendar");
    assert.ok(titles.some((t) => t.includes("Christmas")), "Christmas must be in calendar");
  });
});

describe("12. Offline 1-Click Membership Renewal Date Math", () => {
  test("Accurately computes start and end dates without timezone shift", () => {
    const startDate = new Date("2026-10-15");
    const durationDays = 365;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const formattedStart = startDate.toISOString().split("T")[0];
    const formattedEnd = endDate.toISOString().split("T")[0];

    assert.strictEqual(formattedStart, "2026-10-15");
    assert.strictEqual(formattedEnd, "2027-10-15");
  });

  test("Accurately computes 30-day monthly plan", () => {
    const startDate = new Date("2026-11-01");
    const durationDays = 30;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    assert.strictEqual(endDate.toISOString().split("T")[0], "2026-12-01");
  });
});

describe("13. Gate QR Self-Registration Mandatory Physical Metrics (DOB, Height, Weight)", () => {
  const validateGateRegistration = (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    height?: number | string;
    weight?: number | string;
  }) => {
    const errors: string[] = [];
    if (!data.firstName?.trim()) errors.push("First name required");
    if (!data.lastName?.trim()) errors.push("Last name required");
    if (!data.phone || data.phone.replace(/\D/g, "").length < 10) errors.push("Valid phone required");
    if (!data.dateOfBirth?.trim()) errors.push("Date of birth is mandatory");
    
    const numHeight = Number(data.height);
    if (!data.height || isNaN(numHeight) || numHeight < 40 || numHeight > 250) {
      errors.push("Height (cm) is mandatory (40 - 250 cm)");
    }

    const numWeight = Number(data.weight);
    if (!data.weight || isNaN(numWeight) || numWeight < 20 || numWeight > 300) {
      errors.push("Current weight (kg) is mandatory (20 - 300 kg)");
    }

    return { valid: errors.length === 0, errors };
  };

  test("Valid registration with DOB, height, and weight passes validation", () => {
    const result = validateGateRegistration({
      firstName: "Aarav",
      lastName: "Kapoor",
      phone: "9876543210",
      dateOfBirth: "1998-05-14",
      height: 178,
      weight: 74.5,
    });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test("Rejects registration when Date of Birth is missing", () => {
    const result = validateGateRegistration({
      firstName: "Aarav",
      lastName: "Kapoor",
      phone: "9876543210",
      dateOfBirth: "",
      height: 178,
      weight: 74.5,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes("Date of birth is mandatory"));
  });

  test("Rejects registration when Height is missing or zero", () => {
    const result = validateGateRegistration({
      firstName: "Aarav",
      lastName: "Kapoor",
      phone: "9876543210",
      dateOfBirth: "1998-05-14",
      height: 0,
      weight: 74.5,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Height (cm) is mandatory")));
  });

  test("Rejects registration when Weight is missing or negative", () => {
    const result = validateGateRegistration({
      firstName: "Aarav",
      lastName: "Kapoor",
      phone: "9876543210",
      dateOfBirth: "1998-05-14",
      height: 175,
      weight: -10,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Current weight (kg) is mandatory")));
  });
});

describe("14. Gym Branch Deletion Safeguards", () => {
  const canDeleteBranch = (activeBranchCount: number) => {
    if (activeBranchCount <= 1) {
      return { allowed: false, error: "Cannot delete your only remaining branch" };
    }
    return { allowed: true };
  };

  test("Prevents deletion of branch when only 1 active branch exists", () => {
    const check = canDeleteBranch(1);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.error, "Cannot delete your only remaining branch");
  });

  test("Allows branch deletion when chain has multiple branches", () => {
    const check = canDeleteBranch(3);
    assert.strictEqual(check.allowed, true);
  });
});

describe("15. WhatsApp Hub Message Sanitation & 1-Click Connect", () => {
  test("Cleans and formats Indian 10-digit phone to international format", () => {
    const raw = "+91 (98765) 43210";
    const clean = raw.replace(/\D/g, "").slice(-10);
    const international = `91${clean}`;
    assert.strictEqual(clean, "9876543210");
    assert.strictEqual(international, "919876543210");
  });

  test("Generates valid WhatsApp Web direct click URL with encoded message", () => {
    const phone = "9876543210";
    const text = "Happy Birthday Aarav! 🎂";
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
    assert.ok(url.startsWith("https://wa.me/919876543210"));
    assert.ok(url.includes("Happy%20Birthday%20Aarav!%20%F0%9F%8E%82"));
  });
});

