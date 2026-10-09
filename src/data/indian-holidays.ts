export interface IndianHoliday {
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  isNationalHoliday?: boolean;
}

export const OFFICIAL_INDIAN_GOVT_HOLIDAYS: IndianHoliday[] = [
  // 2025 Gazetted Holidays
  { title: "Republic Day 🇮🇳", date: "2025-01-26", description: "National Gazetted Holiday (Constitution Day)", isNationalHoliday: true },
  { title: "Maha Shivratri 🔱", date: "2025-02-26", description: "Gazetted Holiday" },
  { title: "Holi 🎨", date: "2025-03-14", description: "Festival of Colours - Gazetted Holiday" },
  { title: "Id-ul-Fitr (Ramzan Eid) 🌙", date: "2025-03-31", description: "Gazetted Holiday" },
  { title: "Mahavir Jayanti 🕊️", date: "2025-04-10", description: "Gazetted Holiday" },
  { title: "Good Friday ✝️", date: "2025-04-18", description: "Gazetted Holiday" },
  { title: "Buddha Purnima ☸️", date: "2025-05-12", description: "Gazetted Holiday" },
  { title: "Bakrid / Eid-ul-Adha 🐑", date: "2025-06-07", description: "Gazetted Holiday" },
  { title: "Muharram 🏴", date: "2025-07-06", description: "Gazetted Holiday" },
  { title: "Independence Day 🇮🇳", date: "2025-08-15", description: "National Gazetted Holiday (Independence Day)", isNationalHoliday: true },
  { title: "Janmashtami (Vaishnava) 🦚", date: "2025-08-16", description: "Gazetted Holiday" },
  { title: "Milad-un-Nabi (Eid-e-Milad) 🕌", date: "2025-09-05", description: "Gazetted Holiday" },
  { title: "Mahatma Gandhi's Birthday 🇮🇳", date: "2025-10-02", description: "National Gazetted Holiday (Gandhi Jayanti)", isNationalHoliday: true },
  { title: "Dussehra (Vijay Dashami) 🏹", date: "2025-10-02", description: "Gazetted Holiday" },
  { title: "Diwali (Deepavali) 🪔", date: "2025-10-20", description: "Festival of Lights - Gazetted Holiday" },
  { title: "Guru Nanak's Birthday ☬", date: "2025-11-05", description: "Guru Nanak Jayanti - Gazetted Holiday" },
  { title: "Christmas Day 🎄", date: "2025-12-25", description: "Gazetted Holiday" },

  // 2026 Gazetted Holidays
  { title: "Republic Day 🇮🇳", date: "2026-01-26", description: "National Gazetted Holiday (Constitution Day)", isNationalHoliday: true },
  { title: "Maha Shivratri 🔱", date: "2026-02-15", description: "Gazetted Holiday" },
  { title: "Holi 🎨", date: "2026-03-04", description: "Festival of Colours - Gazetted Holiday" },
  { title: "Id-ul-Fitr (Ramzan Eid) 🌙", date: "2026-03-20", description: "Gazetted Holiday" },
  { title: "Mahavir Jayanti 🕊️", date: "2026-03-31", description: "Gazetted Holiday" },
  { title: "Good Friday ✝️", date: "2026-04-03", description: "Gazetted Holiday" },
  { title: "Buddha Purnima ☸️", date: "2026-05-01", description: "Gazetted Holiday" },
  { title: "Bakrid / Eid-ul-Adha 🐑", date: "2026-05-27", description: "Gazetted Holiday" },
  { title: "Muharram 🏴", date: "2026-06-26", description: "Gazetted Holiday" },
  { title: "Independence Day 🇮🇳", date: "2026-08-15", description: "National Gazetted Holiday (Independence Day)", isNationalHoliday: true },
  { title: "Janmashtami 🦚", date: "2026-09-04", description: "Gazetted Holiday" },
  { title: "Milad-un-Nabi 🕌", date: "2026-08-26", description: "Gazetted Holiday" },
  { title: "Mahatma Gandhi's Birthday 🇮🇳", date: "2026-10-02", description: "National Gazetted Holiday (Gandhi Jayanti)", isNationalHoliday: true },
  { title: "Dussehra (Vijay Dashami) 🏹", date: "2026-10-20", description: "Gazetted Holiday" },
  { title: "Diwali (Deepavali) 🪔", date: "2026-11-08", description: "Festival of Lights - Gazetted Holiday" },
  { title: "Guru Nanak's Birthday ☬", date: "2026-11-24", description: "Guru Nanak Jayanti - Gazetted Holiday" },
  { title: "Christmas Day 🎄", date: "2026-12-25", description: "Gazetted Holiday" },

  // 2027 Gazetted Holidays
  { title: "Republic Day 🇮🇳", date: "2027-01-26", description: "National Gazetted Holiday (Constitution Day)", isNationalHoliday: true },
  { title: "Maha Shivratri 🔱", date: "2027-03-06", description: "Gazetted Holiday" },
  { title: "Holi 🎨", date: "2027-03-23", description: "Festival of Colours - Gazetted Holiday" },
  { title: "Good Friday ✝️", date: "2027-03-26", description: "Gazetted Holiday" },
  { title: "Independence Day 🇮🇳", date: "2027-08-15", description: "National Gazetted Holiday (Independence Day)", isNationalHoliday: true },
  { title: "Mahatma Gandhi's Birthday 🇮🇳", date: "2027-10-02", description: "National Gazetted Holiday (Gandhi Jayanti)", isNationalHoliday: true },
  { title: "Diwali (Deepavali) 🪔", date: "2027-10-29", description: "Festival of Lights - Gazetted Holiday" },
  { title: "Christmas Day 🎄", date: "2027-12-25", description: "Gazetted Holiday" },
];
