import type { LucideIcon } from "lucide-react";

type BrandGradientPlaceholderProps = {
    className?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    showBottomOverlay?: boolean;
};

export function BrandGradientPlaceholder({
    className = "absolute inset-0",
    icon: Icon,
    iconClassName = "h-12 w-12",
    showBottomOverlay = false,
}: BrandGradientPlaceholderProps) {
    return (
        <div className={`overflow-hidden ${className}`} aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-br from-[#002050] via-[#003080] to-[#0060f0]" />
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/[0.07]" />
            <div className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-[#0060f0]/20" />
            {showBottomOverlay && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001535]/40 to-transparent" />
            )}
            {Icon && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`${iconClassName} text-white/30`} strokeWidth={1.5} />
                </div>
            )}
        </div>
    );
}

export default BrandGradientPlaceholder;
