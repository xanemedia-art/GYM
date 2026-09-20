"use client";

import React, { useState, createContext, useContext } from "react";
import { DumbbellCursor } from "./DumbbellCursor";
import { MouseGlow } from "./MouseGlow";
import { WebsiteNavbar } from "./WebsiteNavbar";
import { WebsiteFooter } from "./WebsiteFooter";
import { BookNowModal } from "./BookNowModal";
import { InquireNowModal } from "./InquireNowModal";

import { WebsiteContent, DEFAULT_WEBSITE_CONTENT } from "@/types/website-content";

interface WebsiteModalContextType {
  openBookNow: (branchSlug?: string) => void;
  openInquireNow: (branchSlug?: string) => void;
}

export const globalOpenBookNow = (branchSlug?: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bff:open-book-now", { detail: { branchSlug } }));
  }
};

export const globalOpenInquireNow = (branchSlug?: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bff:open-inquire-now", { detail: { branchSlug } }));
  }
};

const WebsiteModalContext = createContext<WebsiteModalContextType>({
  openBookNow: globalOpenBookNow,
  openInquireNow: globalOpenInquireNow,
});

export const useWebsiteModals = () => {
  const ctx = useContext(WebsiteModalContext);
  return {
    openBookNow: (slug?: string) => {
      if (ctx.openBookNow && ctx.openBookNow !== globalOpenBookNow) {
        ctx.openBookNow(slug);
      }
      globalOpenBookNow(slug);
    },
    openInquireNow: (slug?: string) => {
      if (ctx.openInquireNow && ctx.openInquireNow !== globalOpenInquireNow) {
        ctx.openInquireNow(slug);
      }
      globalOpenInquireNow(slug);
    },
  };
};

const WebsiteContentContext = createContext<{
  content: WebsiteContent;
  refreshContent: () => Promise<void>;
}>({
  content: DEFAULT_WEBSITE_CONTENT,
  refreshContent: async () => {},
});

export const useWebsiteContent = () => useContext(WebsiteContentContext);

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_WEBSITE_CONTENT);
  const [bookNowOpen, setBookNowOpen] = useState(false);
  const [inquireNowOpen, setInquireNowOpen] = useState(false);
  const [activeBranchSlug, setActiveBranchSlug] = useState<string | undefined>();

  const refreshContent = async () => {
    try {
      const res = await fetch("/api/v1/website-content");
      const json = await res.json();
      if (json.success && json.data) {
        setContent(json.data);
      }
    } catch (e) {
      console.warn("Website content load error:", e);
    }
  };

  React.useEffect(() => {
    refreshContent();

    const handleContentUpdated = () => {
      refreshContent();
    };

    window.addEventListener("bff:content-updated", handleContentUpdated);
    return () => window.removeEventListener("bff:content-updated", handleContentUpdated);
  }, []);

  const openBookNow = (branchSlug?: string) => {
    setActiveBranchSlug(branchSlug);
    setBookNowOpen(true);
  };

  const openInquireNow = (branchSlug?: string) => {
    setActiveBranchSlug(branchSlug);
    setInquireNowOpen(true);
  };

  React.useEffect(() => {
    const handleBook = (e: Event) => {
      const customEvent = e as CustomEvent<{ branchSlug?: string }>;
      openBookNow(customEvent.detail?.branchSlug);
    };

    const handleInquire = (e: Event) => {
      const customEvent = e as CustomEvent<{ branchSlug?: string }>;
      openInquireNow(customEvent.detail?.branchSlug);
    };

    window.addEventListener("bff:open-book-now", handleBook);
    window.addEventListener("bff:open-inquire-now", handleInquire);

    return () => {
      window.removeEventListener("bff:open-book-now", handleBook);
      window.removeEventListener("bff:open-inquire-now", handleInquire);
    };
  }, []);

  return (
    <WebsiteContentContext.Provider value={{ content, refreshContent }}>
      <WebsiteModalContext.Provider value={{ openBookNow, openInquireNow }}>
        <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col relative selection:bg-lime-400 selection:text-slate-950">
          {/* Custom Gym Dumbbell Cursor */}
          <DumbbellCursor />

          {/* Ambient Radial Mouse Glow */}
          <MouseGlow />

          {/* Global Website Header */}
          <WebsiteNavbar onBookNowClick={() => openBookNow()} />

          {/* Page Content */}
          <main className="flex-1 pt-24 pb-16 relative z-10">{children}</main>

          {/* Global Website Footer */}
          <WebsiteFooter />

          {/* Global Modals */}
          <BookNowModal
            isOpen={bookNowOpen}
            onClose={() => setBookNowOpen(false)}
            initialBranchSlug={activeBranchSlug}
          />

          <InquireNowModal
            isOpen={inquireNowOpen}
            onClose={() => setInquireNowOpen(false)}
            initialBranchSlug={activeBranchSlug}
          />
        </div>
      </WebsiteModalContext.Provider>
    </WebsiteContentContext.Provider>
  );
}
