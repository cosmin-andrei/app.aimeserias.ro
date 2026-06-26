import type { ReactNode } from "react";

const DETAIL_LINE_RE = /^\*\*([^*]+)\*\*:\s*(.*)$/;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function splitLines(block: string): string[] {
  return normalizeNewlines(block).split("\n");
}

function formatInlineMarkdown(line: string): ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-800 dark:text-[#E5E7EB]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function parseDetailLine(line: string): { label: string; value: string } | null {
  const content = line.startsWith("- ") ? line.slice(2) : line;
  const match = content.match(DETAIL_LINE_RE);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim() };
}

function isDetailList(lines: string[]): boolean {
  const items = lines.filter((line) => line.startsWith("- "));
  return items.length > 0 && items.every((line) => parseDetailLine(line) !== null);
}

function DetailList({ lines }: { lines: string[] }) {
  const items = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => parseDetailLine(line)!);

  return (
    <dl className="mt-3 overflow-hidden rounded-xl bg-[#fafcff] ring-1 ring-[#002050]/6 dark:bg-white/[0.04] dark:ring-white/[0.08]">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4 sm:py-3.5 ${
            i > 0 ? "border-t border-[#002050]/6 dark:border-white/[0.06]" : ""
          }`}
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#0060f0] dark:text-[#5b9fff]">
            {item.label}
          </dt>
          <dd className="text-sm leading-relaxed text-gray-700 dark:text-[#E5E7EB]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BulletList({ lines }: { lines: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {lines
        .filter((line) => line.startsWith("- "))
        .map((line) => (
          <li key={line} className="flex gap-3 text-sm leading-relaxed text-gray-600 dark:text-[#C5CAD3]">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0060f0] dark:bg-[#5b9fff]"
              aria-hidden
            />
            <span>{formatInlineMarkdown(line.slice(2))}</span>
          </li>
        ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-gray-100 pb-2.5 pt-8 text-base font-bold tracking-tight text-gray-900 first:pt-0 dark:border-white/[0.08] dark:text-white">
      {children}
    </h2>
  );
}

/** Renderer minimal pentru conținut markdown (fără dependențe externe). */
export function renderSimpleMarkdown(content: string): ReactNode[] {
  const blocks = normalizeNewlines(content).trim().split(/\n\n+/);

  return blocks.map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("## ")) {
      return (
        <SectionHeading key={index}>{trimmed.slice(3).trim()}</SectionHeading>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-[#9CA3AF]"
        >
          {trimmed.slice(4).trim()}
        </h3>
      );
    }

    const lines = splitLines(trimmed);

    if (lines.every((line) => line.startsWith("- "))) {
      if (isDetailList(lines)) {
        return <DetailList key={index} lines={lines} />;
      }
      return <BulletList key={index} lines={lines} />;
    }

    if (trimmed.includes("\n- ")) {
      const [intro, ...rest] = lines;
      const listLines = rest.filter((line) => line.startsWith("- "));

      return (
        <div key={index} className="mt-3 space-y-2">
          {intro && (
            <p className="text-[15px] leading-7 text-gray-600 dark:text-[#9CA3AF]">
              {formatInlineMarkdown(intro)}
            </p>
          )}
          {isDetailList(listLines) ? (
            <DetailList lines={listLines} />
          ) : (
            <BulletList lines={listLines} />
          )}
        </div>
      );
    }

    return (
      <p
        key={index}
        className="mt-3 text-[15px] leading-7 text-gray-600 dark:text-[#9CA3AF]"
      >
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {formatInlineMarkdown(line)}
          </span>
        ))}
      </p>
    );
  });
}
