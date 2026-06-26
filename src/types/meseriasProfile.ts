export type PortfolioMediaType = "image" | "video";

export interface PortfolioMedia {
    id: string;
    type: PortfolioMediaType;
    url: string;
    thumbnail?: string;
    title: string;
    projectSlug?: string;
    projectTitle?: string;
}

export interface MeseriasReview {
    id: string;
    author: string;
    rating: number;
    date: string;
    text: string;
    project?: string;
}

export interface MeseriasProfileExtras {
    coverImage?: string;
    portfolio: PortfolioMedia[];
    reviews: MeseriasReview[];
    teamMembers?: FirmaTeamMember[];
}

export interface FirmaTeamMember {
    id: string;
    name: string;
    role: string;
    image: string;
    rating: number;
    reviewCount: number;
    portfolio: PortfolioMedia[];
    reviews: MeseriasReview[];
}
