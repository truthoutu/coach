/**
 * Dark brand bar — single COACH wordmark, centered.
 * Fixed h-9, scrolls away with the page like the reference.
 */
export default function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <div
        className="mx-auto flex h-9 max-w-[1440px] items-center justify-center px-4"
        aria-label="Brand"
      >
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white">
          Coach
        </span>
      </div>
    </div>
  );
}
