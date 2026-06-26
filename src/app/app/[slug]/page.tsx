import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function AppPage({ params }: Props) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-stroke dark:bg-[#1F1F1F] dark:ring-white/[0.06]">
      <h1 className="text-2xl font-bold text-dark dark:text-white">{title}</h1>
      <p className="mt-2 text-dark-5 dark:text-[#9CA3AF]">
        Conținutul aplicației va fi afișat aici. Poți conecta această pagină la serviciul real sau la un link extern.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
      >
        ← Înapoi la Dashboard
      </Link>
    </div>
  );
}
