import fs from "fs";
import path from "path";
import { BRANCHES } from "@/data/branches";
import {
  WebsiteContent,
  DEFAULT_WEBSITE_CONTENT,
} from "@/types/website-content";

export * from "@/types/website-content";

const CONTENT_FILE_PATH = path.join(process.cwd(), "src", "data", "website-content.json");

let cachedContent: WebsiteContent | null = null;

export function getWebsiteContent(): WebsiteContent {
  if (cachedContent) {
    return cachedContent;
  }

  try {
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const fileData = fs.readFileSync(CONTENT_FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileData);
      cachedContent = {
        general: { ...DEFAULT_WEBSITE_CONTENT.general, ...parsed.general },
        sections: {
          hero: { ...DEFAULT_WEBSITE_CONTENT.sections.hero, ...parsed.sections?.hero },
          about: { ...DEFAULT_WEBSITE_CONTENT.sections.about, ...parsed.sections?.about },
          franchise: { ...DEFAULT_WEBSITE_CONTENT.sections.franchise, ...parsed.sections?.franchise },
        },
        branches: Array.isArray(parsed.branches) && parsed.branches.length > 0 ? parsed.branches : BRANCHES,
      };
      return cachedContent;
    }
  } catch (err) {
    console.warn("Could not read website-content.json, using defaults:", err);
  }
  return DEFAULT_WEBSITE_CONTENT;
}

export function saveWebsiteContent(content: WebsiteContent): void {
  try {
    const dir = path.dirname(CONTENT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), "utf-8");
    cachedContent = content; // update in-memory cache immediately
  } catch (err) {
    console.error("Failed to save website-content.json:", err);
    throw err;
  }
}
