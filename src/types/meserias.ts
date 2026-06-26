export type MeseriasType = "individual" | "firma";

export interface Meserias {
    id: string;
    slug: string;
    name: string;
    type: MeseriasType;
    tagline: string;
    description: string;
    location: string;
    city: string;
    county: string;
    categories: string[];
    trades: string[];
    rating: number;
    reviewCount: number;
    completedProjects: number;
    verified: boolean;
    image: string;
    teamSize?: number;
    memberSince: string;
    phone: string;
    email: string;
    /** Doar pentru meseriași individuali */
    hasPfa?: boolean;
    /** Doar pentru meseriași individuali — studii/formare în domeniu */
    hasDomainStudies?: boolean;
    /** Specializări cu studii verificate în domeniu */
    studiesVerifiedSpecializations?: string[];
    /** Doar pentru firme */
    companyUserId?: number;
    companyCui?: string | null;
    companyRegCom?: string | null;
    companyLegalForm?: string | null;
    companyAddress?: string | null;
}
