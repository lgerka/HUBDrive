import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    showBack?: boolean;
    onBack?: () => void;
}

export function PageHeader({
    title,
    description,
    children,
    className,
    showBack,
    onBack,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                className
            )}
        >
            <div className="flex h-14 items-center px-4 gap-4">
                {showBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="flex flex-1 flex-col justify-center">
                    <h1 className="text-lg font-semibold leading-none tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
                {children && <div className="flex items-center gap-2">{children}</div>}
            </div>
        </div>
    );
}
