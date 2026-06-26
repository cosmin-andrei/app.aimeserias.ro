export const PROJECT_SUBCATEGORIES: Record<string, string[]> = {
    "constructii-si-renovari": [
        "Zugrăvit",
        "Glet",
        "Faianțar",
        "Zidar",
        "Tencuieli",
        "Fațadist",
        "Șape",
    ],
    instalatii: ["Instalații sanitare", "Centrale termice", "Încălzire pardoseală", "Instalații gaze"],
    "electricitate-si-climatizare": [
        "Electrician",
        "Tablouri electrice",
        "Aer condiționat",
        "Pompe de căldură",
        "Frigorist",
    ],
    "tamplarie-mobilier-si-termopane": [
        "Tâmplar",
        "Termopane",
        "Mobilier la comandă",
        "Uși interioare",
        "Montaj termopane",
    ],
    "amenajari-exterioare-si-gradina": ["Peisagistică", "Irigații", "Gazon", "Garduri"],
    "curatenie-si-mutari": ["Curățenie", "Mutări", "Debarasare"],
    "securitate-si-sisteme-tehnice": ["Alarme", "Camere video", "Smart home"],
    "mecanica-si-reparatii": ["Reparații generale", "Service", "Întreținere"],
    "sudura-si-confectii-metalice": ["Sudură", "Confecții metalice", "Porți metalice"],
};

export const PROJECT_STATUSES = ["Caut meseriași", "În desfășurare", "Finalizat"] as const;

export const CLIENT_RATING_FILTERS = [
    { value: "5", label: "5 stele", stars: 5, min: 4.5, max: Infinity },
    { value: "4", label: "4 stele", stars: 4, min: 4, max: 4.5 },
    { value: "3", label: "3 stele", stars: 3, min: 3, max: 4 },
    { value: "2", label: "2 stele", stars: 2, min: 2, max: 3 },
    { value: "1", label: "1 stele", stars: 1, min: 1, max: 2 },
] as const;
