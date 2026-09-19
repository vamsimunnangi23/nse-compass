export function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
      <ShieldIcon />
      <p>
        <span className="font-semibold">Educational only.</span> Historical
        technical signals can be wrong. This is not personalized financial
        advice; assess your own risk before investing.
      </p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
      <AlertIcon />
      <p>
        <span className="font-semibold">Live data unavailable.</span>{" "}
        {message} The dashboard deliberately does not show mock or stale
        substitute values.
      </p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0"
    >
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0"
    >
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
    </svg>
  );
}
