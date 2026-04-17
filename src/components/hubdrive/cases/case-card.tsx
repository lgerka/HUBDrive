import Link from "next/link";
import { User, ArrowRight } from "lucide-react";

export interface CaseCardProps {
    id: string;
    title: string;
    price: number;
    year: number;
    user: {
        name: string;
        city: string;
    };
    quote: string;
    imageUrl: string;
}

export function CaseCard({ caseItem }: { caseItem: CaseCardProps }) {
    return (
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border group transition-all hover:shadow-md">
            <Link href={`/cases/${caseItem.id}`} className="block overflow-hidden">
                <div 
                    className="aspect-video w-full bg-muted bg-cover bg-center transition-transform hover:scale-105 duration-500"
                    style={{ backgroundImage: `url('${caseItem.imageUrl}')` }}
                />
            </Link>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <Link href={`/cases/${caseItem.id}`} className="hover:underline">
                        <h3 className="text-lg font-bold leading-tight">
                            {caseItem.title} - {caseItem.year}
                        </h3>
                    </Link>
                    <span className="text-primary font-bold whitespace-nowrap">
                        {caseItem.price.toLocaleString('ru-RU')} ₸
                    </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm">
                    <User className="w-4 h-4" />
                    <span>{caseItem.user.name}, {caseItem.user.city}</span>
                </div>
                
                <p className="text-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                    {caseItem.quote}
                </p>
                
                <Link 
                    href={`/cases/${caseItem.id}`}
                    className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <span>Читать далее</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
