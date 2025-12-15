import { cn } from "@/lib/utils";

interface AdPlaceholderProps {
    slotId: string;
    className?: string;
    label?: string;
}

export function AdPlaceholder({ slotId, className, label = "AD AREA" }: AdPlaceholderProps) {
    // Mission 26-F: Adsense Layout Slot Only (No Scripts)
    return (
        <div
            id={slotId}
            className={cn(
                "w-full h-[90px] hidden sm:flex items-center justify-center border border-white/5 bg-white/5 mx-auto my-2 rounded-md transition-all",
                className
            )}
        >
            <span className="text-[10px] text-gray-700 tracking-[0.2em] font-bold uppercase select-none">
                {label}
            </span>
        </div>
    );
}
