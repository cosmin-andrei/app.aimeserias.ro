export type HeroCategory = {
    slug: string;
    label: string;
};

export const HERO_CATEGORIES: HeroCategory[] = [
    { slug: "constructii-si-renovari", label: "Construcții și renovări" },
    { slug: "instalatii", label: "Instalații" },
    { slug: "electricitate-si-climatizare", label: "Electricitate și climatizare" },
    { slug: "tamplarie-mobilier-si-termopane", label: "Tâmplărie, mobilier și termopane" },
    { slug: "amenajari-exterioare-si-gradina", label: "Amenajări exterioare și grădină" },
    { slug: "curatenie-si-mutari", label: "Curățenie și mutări" },
    { slug: "securitate-si-sisteme-tehnice", label: "Securitate și sisteme tehnice" },
    { slug: "mecanica-si-reparatii", label: "Mecanică și reparații" },
    { slug: "sudura-si-confectii-metalice", label: "Sudură și confecții metalice" },
    { slug: "alte-servicii", label: "Alte servicii" },
];
