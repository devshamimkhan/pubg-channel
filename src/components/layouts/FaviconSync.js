"use client";

import { useEffect } from "react";

export const FAVICON_SYNC_EVENT = "pubg-community:favicon-sync";
export const FAVICON_STORAGE_KEY = "pubg-community:favicon-href";
export const DEFAULT_FAVICON_HREF = "/favicon.ico";

function normalizeFaviconHref(href) {
  if (typeof href !== "string") {
    return DEFAULT_FAVICON_HREF;
  }

  const trimmedHref = href.trim();
  return trimmedHref || DEFAULT_FAVICON_HREF;
}

function getStoredFaviconHref() {
  if (typeof window === "undefined") {
    return DEFAULT_FAVICON_HREF;
  }

  try {
    return normalizeFaviconHref(window.localStorage.getItem(FAVICON_STORAGE_KEY));
  } catch {
    return DEFAULT_FAVICON_HREF;
  }
}

function getFaviconLinks() {
  return Array.from(
    document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]')
  );
}

function ensureFaviconLink(href) {
  const existingLinks = getFaviconLinks();

  if (existingLinks.length === 0) {
    const link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("type", "image/x-icon");
    link.setAttribute("href", href);
    document.head.appendChild(link);
    return;
  }

  existingLinks.forEach((link) => {
    link.setAttribute("href", href);

    if (!link.getAttribute("rel")) {
      link.setAttribute("rel", "icon");
    }
  });
}

export function applyFaviconHref(href) {
  if (typeof document === "undefined") {
    return normalizeFaviconHref(href);
  }

  const nextHref = normalizeFaviconHref(href);
  ensureFaviconLink(nextHref);
  return nextHref;
}

export function publishFaviconHref(href) {
  const nextHref = normalizeFaviconHref(href);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FAVICON_STORAGE_KEY, nextHref);
    } catch {
      // Ignore storage access failures.
    }

    window.dispatchEvent(
      new CustomEvent(FAVICON_SYNC_EVENT, {
        detail: { href: nextHref },
      })
    );
  }

  applyFaviconHref(nextHref);

  return nextHref;
}

export default function FaviconSync({ initialHref = DEFAULT_FAVICON_HREF }) {
  useEffect(() => {
    const handleFaviconSync = (event) => {
      const href = event?.detail?.href;

      applyFaviconHref(href ?? getStoredFaviconHref());
    };

    const handleStorage = (event) => {
      if (event.key && event.key !== FAVICON_STORAGE_KEY) {
        return;
      }

      applyFaviconHref(event.newValue ?? DEFAULT_FAVICON_HREF);
    };

    applyFaviconHref(initialHref || getStoredFaviconHref());

    window.addEventListener(FAVICON_SYNC_EVENT, handleFaviconSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FAVICON_SYNC_EVENT, handleFaviconSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialHref]);

  return null;
}
