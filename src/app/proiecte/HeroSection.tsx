import React from "react";

interface HeroProject {
    id: string;
    title: string;
    category: string;
    status: string;
    date: string;
    image: string;
}

interface HeroSectionProps {
    heroProject: HeroProject | null;
    handleProjectClick: (id: string) => void;
}

export function HeroSection({ heroProject, handleProjectClick }: HeroSectionProps) {
    if (!heroProject) return null;

    return (
        <section
            className="relative w-full min-h-[400px] md:min-h-[500px] bg-cover bg-center flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: `url(${heroProject.image})` }}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
            
            {/* Content Card */}
            <div
                className="relative z-10 w-11/12 md:w-4/5 lg:w-3/5 bg-white rounded-xl p-6 md:p-8 lg:p-10 shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl hover:-translate-y-1"
                onClick={() => handleProjectClick(heroProject.id)}
            >
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">{heroProject.title}</h1>
                <div className="flex justify-center md:justify-start gap-3 mt-6 flex-wrap">
                    <span className="bg-custom-blue text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        {heroProject.category}
                    </span>
                    <span className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        {heroProject.status}
                    </span>
                </div>
                <span className="text-gray-600 text-sm md:text-base mt-6 block font-medium">{heroProject.date}</span>
            </div>
        </section>
    );
}

export default HeroSection;
