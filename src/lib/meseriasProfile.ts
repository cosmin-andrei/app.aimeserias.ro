import profileExtras from "@/data/meseriasProfileExtras.json";
import { PROJECTS } from "@/lib/project";
import type { Meserias } from "@/types/meserias";
import type {
    FirmaTeamMember,
    MeseriasProfileExtras,
    MeseriasReview,
} from "@/types/meseriasProfile";

const EXTRAS = profileExtras as Record<string, MeseriasProfileExtras>;

const FALLBACK_PORTFOLIO_IMAGES = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
];

function buildFallbackReviews(meserias: Meserias): MeseriasReview[] {
    const trade = meserias.trades[0] ?? "lucrare";
    return [
        {
            id: "fb1",
            author: "Client verificat",
            rating: Math.min(5, Math.round(meserias.rating)),
            date: "2025-10-15",
            text: `Colaborare excelentă pentru ${trade.toLowerCase()}. Rezultatul a depășit așteptările, recomand cu încredere.`,
            project: trade,
        },
        {
            id: "fb2",
            author: "Client verificat",
            rating: Math.max(4, Math.floor(meserias.rating)),
            date: "2025-07-08",
            text: "Comunicare clară, respectă termenele și lasă șantierul curat. Voi apela din nou.",
            project: meserias.trades[1] ?? trade,
        },
    ];
}

function buildFallbackTeamMembers(meserias: Meserias): FirmaTeamMember[] {
    if (meserias.type !== "firma") return [];

    const count = Math.min(meserias.teamSize ?? 3, 4);
    const names = ["Alexandru M.", "Bogdan P.", "Cristian T.", "Dan V."];
    const roles = meserias.trades.length > 0 ? meserias.trades : ["Meseriaș"];
    const images = [
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    ];

    return Array.from({ length: count }, (_, i) => {
        const role = roles[i % roles.length];
        const rating = Math.min(5, meserias.rating + (i % 2 === 0 ? 0.1 : -0.1));
        const reviewCount = Math.max(3, Math.floor(meserias.reviewCount / count));

        return {
            id: `team-${i + 1}`,
            name: names[i],
            role,
            image: images[i],
            rating: Math.round(rating * 10) / 10,
            reviewCount,
            portfolio: FALLBACK_PORTFOLIO_IMAGES.slice(0, 3).map((url, j) => {
                const project = PROJECTS[j % PROJECTS.length];
                return {
                    id: `team-${i}-p${j}`,
                    type: "image" as const,
                    url,
                    title: `${role} — proiect ${j + 1}`,
                    projectSlug: project.id,
                    projectTitle: project.title,
                };
            }),
            reviews: [
                {
                    id: `team-${i}-r1`,
                    author: "Client verificat",
                    rating: Math.min(5, Math.round(rating)),
                    date: "2025-09-10",
                    text: `${names[i].split(" ")[0]} a făcut o treabă excelentă la ${role.toLowerCase()}. Recomand!`,
                    project: role,
                },
            ],
        };
    });
}

export function getMeseriasProfileExtras(meserias: Meserias): MeseriasProfileExtras {
    const stored = EXTRAS[meserias.slug];
    if (stored) {
        return {
            ...stored,
            teamMembers:
                stored.teamMembers ??
                (meserias.type === "firma" ? buildFallbackTeamMembers(meserias) : undefined),
        };
    }

    return {
        portfolio: FALLBACK_PORTFOLIO_IMAGES.map((url, i) => {
            const project = PROJECTS[i % PROJECTS.length];
            return {
                id: `fb-${i}`,
                type: "image" as const,
                url,
                title: meserias.trades[i % meserias.trades.length] ?? "Lucrare finalizată",
                projectSlug: project.id,
                projectTitle: project.title,
            };
        }),
        reviews: buildFallbackReviews(meserias),
        teamMembers: meserias.type === "firma" ? buildFallbackTeamMembers(meserias) : undefined,
    };
}

export function getFirmaTeamMembers(meserias: Meserias): FirmaTeamMember[] {
    if (meserias.type !== "firma") return [];
    return getMeseriasProfileExtras(meserias).teamMembers ?? [];
}

export function formatReviewDate(date: string): string {
    return new Date(date).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
