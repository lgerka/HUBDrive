import { Filter, PurchasePlan } from '@/lib/state/filters.store';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FilterCardProps {
    filter: Filter;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onToggleNotifications?: (id: string) => void;
}

const purchasePlanStyles: Record<PurchasePlan, { bg: string, text: string, dot: string, label: string }> = {
    viewing: { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', dot: 'bg-on-surface/40', label: 'Просто смотрю' },
    three_months: { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', dot: 'bg-on-surface/40', label: 'Планирую покупку' },
    ready_now: { bg: 'bg-primary-container/20', text: 'text-primary-container', dot: 'bg-primary-container', label: 'Готов купить' },
};

export function FilterCard({ filter, onEdit, onDelete, onToggleNotifications }: FilterCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT',
            maximumFractionDigits: 0,
        }).format(price).replace('₸', '₸');
    };

    const planStyle = filter.purchasePlan ? purchasePlanStyles[filter.purchasePlan] : purchasePlanStyles['viewing'];
    
    // Abstract shapes for visual interest depending on filter characteristics
    const bgImage = filter.bodyTypes?.includes('SUV') 
        ? "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDRwMhAzJGijXpvKB_84xZcBl0lH67bCcErhm44nioR2dr5xdmMr-0nUniGzzoaWPqScUL-9G8uYyzFxy3WF6iIfedlrv5JmWSG8j9cEtOe3QXfi-DuqC8aF4DswkwXInVjpnSMtFIuk9XtwsVK6UbK667_RhCJYr6meYPgRjsn0rebrvkjVvVRK3b5QmZgpGaQFsT_zc800YfytfGyr0cRxMSjLs2br1BR9VYBDSDoHwjCwUE38UQyAnZ859njTYsZVyBlwKKhLbir')"
        : "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBCp_ArIJSfW3pc-YsXRc7OEsMhIMwmf__lAX6puXtx6T1OLgDtHrvg8VjtOWqjnPHj8yiDz_ogs9z36KteSnXs7Y5y93YcMqIzjTBhvqmpc88UoACLmwfm4sdIcxgUz9wrLa6xbUHZwZTP40Tg-EaWvUEhmXOrMS22aCFn4bZfJd9hWKDtUpRWkZZEZ8aVnrTJUEu6klbtu5QNvLB8_H_kF8bGGbBlZFZMSsVjrBKqPHrWm_1-ohzdAtQco3PJ9CBowSWwLabsa4eZ')";

    return (
        <div className="bg-surface-container-low rounded-2xl shadow-sm border border-transparent overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest", planStyle.bg, planStyle.text)}>
                            <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", planStyle.dot)}></span>
                            {planStyle.label}
                        </span>
                        <h3 className="mt-3 text-lg font-headline font-extrabold leading-tight text-on-surface">{filter.title || filter.brand || 'Новый фильтр'}</h3>
                        <p className="text-sm font-medium text-on-surface-variant mt-1.5 line-clamp-2">
                            {filter.brand} {filter.model ? `, ${filter.model}` : ''}
                            {filter.budgetMax ? `, до ${formatPrice(filter.budgetMax)}` : ''}
                        </p>
                    </div>
                    <div 
                        className="h-16 w-16 shrink-0 bg-surface-container-highest rounded-xl bg-cover bg-center" 
                        style={{ backgroundImage: bgImage }}
                    />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-surface-variant/30 mt-3">
                    <div className="flex items-center gap-3">
                        <Switch 
                            checked={filter.notificationsEnabled}
                            onCheckedChange={() => onToggleNotifications?.(filter.id)}
                            className="data-[state=checked]:bg-primary-container"
                        />
                        <span className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mr-2">
                            Уведомления
                        </span>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            className="p-2 text-on-surface-variant hover:text-primary-container transition-colors rounded-full hover:bg-surface-container-high"
                            onClick={() => onEdit?.(filter.id)}
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button 
                            className="p-2 text-on-surface-variant hover:text-red-500 transition-colors rounded-full hover:bg-surface-container-high"
                            onClick={() => onDelete?.(filter.id)}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
