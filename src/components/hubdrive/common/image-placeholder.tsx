import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"

interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType
    text?: string
}

export function ImagePlaceholder({
    className,
    icon: Icon = ImageOff,
    text,
    ...props
}: ImagePlaceholderProps) {
    return (
        <div
            className={cn(
                "flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground",
                className
            )}
            {...props}
        >
            <Icon className="h-10 w-10 opacity-20" aria-hidden="true" />
            {text && <span className="mt-2 text-sm font-medium opacity-50">{text}</span>}
            <span className="sr-only">Image placeholder</span>
        </div>
    )
}
