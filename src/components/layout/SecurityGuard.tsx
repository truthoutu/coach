"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    // Developer-facing warning only (Facebook-style). We never block
    // right-click, keyboard shortcuts, or text selection — real security
    // happens server-side (auth, rate limiting, validation), not in the browser.
    const consoleStyle1 =
      "color: #ff0000; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);";
    const consoleStyle2 =
      "color: #1a1a1a; font-size: 14px; line-height: 2;";
    const consoleStyle3 =
      "color: #c0392b; font-size: 13px; font-weight: bold;";

    console.log("%c⛔ STOP!", consoleStyle1);
    console.log(
      "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and they are trying to steal your information.\n\nIf you are a developer: this site is proprietary. Unauthorized reproduction or distribution of any part of this site is prohibited.",
      consoleStyle2
    );
    console.log(
      "%c© 2026 COACH 1 — All rights reserved.",
      consoleStyle3
    );
  }, []);

  return null; // Renders nothing — purely informational
}