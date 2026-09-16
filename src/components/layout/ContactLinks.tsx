"use client";

import React, { useEffect, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";

const CONTACT_EMAIL = "wcoach24@gmail.com";

/**
 * Detects whether the visitor is on an iOS device (iPhone / iPad / iPod).
 * Uses navigator.userAgent — safe to call on the client only.
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Customer contact links block.
 *
 * Renders two touch-points that mirror the existing WhatsApp / Live Chat
 * cards on the Customer Care page but use the boutique's dedicated
 * wcoach24@gmail.com address:
 *
 *  • Email — `mailto:wcoach24@gmail.com` opens the native Mail app on every
 *    platform (iOS Mail, Gmail, Outlook, etc.)
 *
 *  • iMessage — `sms:wcoach24@gmail.com` opens the Messages app on iPhone /
 *    iPad.  On iOS devices that have iMessage configured with this Apple ID
 *    email address, a new iMessage conversation is started immediately.
 *    On non-iOS devices the `sms:` scheme has no handler, so the link is
 *    kept `href="sms:…"` for iOS but a `mailto:` fallback is wired through
 *    a click handler so Android / desktop users still reach the same email.
 */
export default function ContactLinks() {
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());
  }, []);

  const handleImessageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ios) {
      // Not iOS — fall back to email so every platform still gets somewhere.
      e.preventDefault();
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
    // On iOS the default `sms:` href opens the Messages / iMessage app.
  };

  return (
    <div className="flex flex-col gap-4 pt-6 sm:pt-8">
      {/* Email */}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="inline-flex items-center justify-center gap-2 rounded border border-hairline bg-white px-6 py-3 text-[13px] font-medium text-ink-soft hover:border-ink hover:text-ink transition-colors"
      >
        <Mail className="h-4 w-4" strokeWidth={1.5} />
        Email us at {CONTACT_EMAIL}
      </a>

      {/* iMessage (iPhone / iOS only) */}
      <a
        href={`sms:${CONTACT_EMAIL}`}
        onClick={handleImessageClick}
        className="inline-flex items-center justify-center gap-2 rounded border border-hairline bg-white px-6 py-3 text-[13px] font-medium text-ink-soft hover:border-ink hover:text-ink transition-colors"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
        Text us on iMessage
      </a>
    </div>
  );
}
