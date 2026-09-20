import { BRANCHES, Branch } from "@/data/branches";

export interface WebsiteGeneralSettings {
  brandName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  headquarters: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
  };
}

export interface WebsiteSectionsSettings {
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subtitle: string;
    heroImage: string;
    stats: {
      value: string;
      label: string;
      sub: string;
    }[];
  };
  about: {
    badge: string;
    title: string;
    subtitle: string;
    story: string;
    image: string;
  };
  franchise: {
    badge: string;
    title: string;
    subtitle: string;
    image: string;
    capex: string;
    roiMonths: string;
    sqftRequired: string;
    paybackPeriod: string;
  };
}

export interface WebsiteContent {
  general: WebsiteGeneralSettings;
  sections: WebsiteSectionsSettings;
  branches: Branch[];
}

export const IMAGE_PRESETS = [
  {
    id: "gym-floor-dumbbells",
    title: "Heavy Dumbbell Rack & Floor",
    category: "Gym Floor",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "olympic-barbell-squat",
    title: "Olympic Barbell & Lifting Cage",
    category: "Strength",
    url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1471&auto=format&fit=crop",
  },
  {
    id: "cardio-machines-loft",
    title: "Modern Cardio Fleet & Loft",
    category: "Cardio",
    url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "dark-industrial-strength",
    title: "Dark Industrial Strength Zone",
    category: "Atmosphere",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "crossfit-rig-turf",
    title: "CrossFit Movement Rig & Turf",
    category: "Functional",
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop",
  },
  {
    id: "sauna-steam-spa",
    title: "Luxury Finnish Steam & Sauna",
    category: "Wellness",
    url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "head-strength-coach",
    title: "Elite Athletic Training",
    category: "Coaching",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "exterior-entrance-night",
    title: "Gym Exterior & Illumination",
    category: "Exterior",
    url: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1374&auto=format&fit=crop",
  },
];

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  general: {
    brandName: "Be Free Fitness",
    tagline: "North India's Premier Athletic Luxury Gym Chain",
    phone: "+91 98160 12001",
    whatsapp: "919816012001",
    email: "contact@befreefitness.in",
    headquarters: "Central Office, Dhalpur Ground Road, Kullu, HP — 175101",
    socialLinks: {
      instagram: "https://instagram.com/befreefitness",
      facebook: "https://facebook.com/befreefitness",
      youtube: "https://youtube.com/@befreefitness",
    },
  },
  sections: {
    hero: {
      badge: "BE FREE FITNESS NETWORK • 6 Branches in Kullu & Dehradun",
      headline: "UNLEASH YOUR",
      headlineAccent: "FREEDOM.",
      subtitle:
        "North India's premier athletic luxury gym chain. High-caliber Olympic strength lines, automated eSSL smart biometric access, Finnish saunas, and elite mountain-bred coaching.",
      heroImage:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
      stats: [
        { value: "6", label: "Elite Locations", sub: "Kullu Valley & Dehradun" },
        { value: "12,000+", label: "Members Transformed", sub: "Proven body recomposition" },
        { value: "35,000+", label: "Sq.Ft Training Area", sub: "Heavy strength & cardio" },
        { value: "eSSL 100%", label: "Automated Access", sub: "Biometric turnstiles" },
      ],
    },
    about: {
      badge: "THE BE FREE FITNESS STORY",
      title: "FORGED IN THE HIMALAYAS. REFINING ATHLETIC LUXURY.",
      subtitle:
        "Born in Kullu Valley in 2019, Be Free Fitness was founded with a singular conviction: strength training should feel liberating, uncompromising, and deeply empowering.",
      story:
        "From our first flagship at Dhalpur Ground to 6 state-of-the-art facilities across Himachal Pradesh and Uttarakhand, we have built the standard for athletic training in the North.",
      image:
        "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop",
    },
    franchise: {
      badge: "PROVEN ROI • TURNKEY GYM SYSTEMS",
      title: "PARTNER WITH NORTH INDIA'S FASTEST GROWING FITNESS CHAIN",
      subtitle:
        "Join a brand backed by automated eSSL member access, high member retention, centralized member management, and high-margin strength centers.",
      image:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop",
      capex: "₹45L – ₹65L",
      roiMonths: "18 – 24 Mos",
      sqftRequired: "4,500 – 7,500",
      paybackPeriod: "3.2x 5-Yr IRR",
    },
  },
  branches: BRANCHES,
};
