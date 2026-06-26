import Link from "next/link";

const footerLinkClass =
  "text-[#2eb8f0] no-underline transition-colors hover:text-[#1aa3db]";

export function AuthFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(60,64,67,0.6)] bg-[rgba(32,33,36,0.85)] px-5 py-3 text-xs sm:px-5 sm:py-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-white">© 2026 AiMeseriaș</span>
        <Link href="https://aimeserias.ro" className={footerLinkClass}>
          Despre
        </Link>
        <Link href="https://aimeserias.ro/blog" className={footerLinkClass}>
          Blog
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="https://aimeserias.ro" className={footerLinkClass}>
          Confidențialitate
        </Link>
        <Link href="https://aimeserias.ro" className={footerLinkClass}>
          Condiții de utilizare
        </Link>
      </div>
    </footer>
  );
}
