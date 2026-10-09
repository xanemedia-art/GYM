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
