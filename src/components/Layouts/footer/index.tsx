import { sitePath } from "@/lib/site";

type FooterLink = {
  label: string;
  href: string;
  title?: string;
};

const FOOTER_ROWS: FooterLink[][] = [
  [
    { label: "Despre", href: sitePath("/despre"), title: "Despre noi" },
    { label: "Blog", href: sitePath("/blog") },
    { label: "Contact", href: sitePath("/contact") },
  ],
  [
    { label: "Confidențialitate", href: sitePath("/privacy") },
    {
      label: "Condiții",
      href: sitePath("/terms"),
      title: "Condiții de utilizare",
    },
  ],
];

const linkClass =
  "text-[11px] leading-snug text-[#606770] transition-colors hover:text-dark hover:underline dark:text-[#9CA3AF] dark:hover:text-white";

const dotClass = "px-1 text-[11px] text-[#8a8d91] dark:text-[#6B7280]";

export function Footer() {
  return (
    <footer className="shrink-0 overflow-visible border-t border-stroke px-2.5 py-2.5 dark:border-white/[0.06]">
      <nav aria-label="Linkuri utile" className="space-y-0.5">
        {FOOTER_ROWS.map((row) => (
          <ul
            key={row.map((link) => link.href).join("-")}
            className="flex flex-nowrap items-center"
          >
            {row.map(({ label, href, title }, index) => (
              <li key={href} className="inline-flex shrink-0 items-center">
                {index > 0 ? (
                  <span className={dotClass} aria-hidden>
                    ·
                  </span>
                ) : null}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  className={linkClass}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </nav>
      <p className="mt-1.5 text-[11px] leading-snug text-[#8a8d91] dark:text-[#6B7280]">
        © 2026 AiMeseriaș
      </p>
    </footer>
  );
}
