import Image from "next/image";
import { ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderProps {
    id: string;
    title: string;
    status: 'ACTIVE' | 'DELIVERED' | 'CANCELLED';
    date: string;
    price: number;
    imageUrl: string;
}

export function OrderCard({ order }: { order: OrderProps }) {
    const isCancelled = order.status === 'CANCELLED';

    const getStatusStyle = () => {
        switch (order.status) {
            case 'ACTIVE':
                return "bg-primary/10 text-primary";
            case 'DELIVERED':
                return "bg-primary/10 text-primary";
            case 'CANCELLED':
                return "bg-muted text-muted-foreground";
        }
    };

    const getStatusText = () => {
        switch (order.status) {
            case 'ACTIVE': return "В пути";
            case 'DELIVERED': return "Доставлен";
            case 'CANCELLED': return "Отменен";
        }
    };

    return (
        <div className={cn(
            "flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-opacity",
            isCancelled && "opacity-75"
        )}>
            <div className="flex gap-4">
                <div className={cn(
                    "w-24 h-24 shrink-0 bg-muted rounded-lg overflow-hidden relative",
                    isCancelled && "grayscale"
                )}>
                    <Image 
                        src={order.imageUrl} 
                        alt={order.title} 
                        fill
                        className="object-cover"
                    />
                </div>
                
                <div className="flex flex-col justify-between flex-1">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                                {order.title}
                            </h3>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                                getStatusStyle()
                            )}>
                                {getStatusText()}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            №{order.id} • {order.date}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <span className={cn(
                            "text-lg font-bold",
                            isCancelled ? "text-muted-foreground" : "text-foreground"
                        )}>
                            {order.price.toLocaleString('ru-RU')} ₽
                        </span>
                        
                        {isCancelled ? (
                            <button className="flex items-center gap-1 text-primary text-sm font-bold hover:underline active:opacity-70">
                                Повторить
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        ) : (
                            <button className="flex items-center gap-1 text-primary text-sm font-bold hover:underline active:opacity-70">
                                Подробнее
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
