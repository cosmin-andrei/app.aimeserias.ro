export type ClientType = "persoana-fizica" | "companie";

export interface ProjectClient {
    id: string;
    name: string;
    type: ClientType;
    avatar: string;
    location: string;
    memberSince: string;
    projectsPublished: number;
    verified: boolean;
    rating: number;
    reviewCount: number;
    phone: string;
    email: string;
}

export type Project = {
    id: string;
    title: string;
    category: string;
    categorySlug: string;
    subcategories: string[];
    status: "Caut meseriași" | "În desfășurare" | "Finalizat" | string;
    date: string;
    image: string;
    location: string;
    county: string;
    excerpt: string;
    trades: string[];
    budget?: string;
    budgetMin?: number;
    budgetMax?: number;
    publishedAt: string;
    applicants?: number;
    client: ProjectClient;
};
