import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "spoude-domain-banner-dismissed";

export function DomainChangeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Dismissible per session — reappears on next visit/login, not gone forever.
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-foreground text-background px-4 py-2.5 flex items-center justify-center gap-3 text-[13px]">
      <span>
        Spoude is changing domains soon. Find us on{" "}
        <a
          href="https://x.com/spoude"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          X
        </a>
        ,{" "}
        <a
          href="https://linkedin.com/company/spoude"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          LinkedIn
        </a>{" "}
        &{" "}
        <a
          href="https://threads.net/@spoude"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          Threads
        </a>{" "}
        — all @spoude — to stay updated.
      </span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 hover:bg-background/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
