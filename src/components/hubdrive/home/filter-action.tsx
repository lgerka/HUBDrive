import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';

export function FilterAction() {
    return (
        <div className="px-4 py-2">
            <div className="flex flex-col bg-card rounded-xl overflow-hidden border border-border shadow-sm">
                <div 
                    className="h-40 bg-cover bg-center" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0gjmWGuJVEu_I0fX23-NTPsrDOf0s9KIJbJh_Bt7pTwCEe_RtnlUoIQHNu6Ho37zS2-XRf-dqqGpLUcwgNq3btKOnnPA6VyNCR8uHD9bA31Scdfu2diTP-gKqR7139Krf8B-uaHLctROsLhx7QT8Flnz-9iCBTydcxQ24pB3HrzpLBWSYiy5zyns3OV8WVndzvWd9ZKTmFiq00ZBWv4JxhIb8Vx1Ud1Tl6avi78lnff8C-4Zwdp3dd2Wz86Z2G597iYtBSA5Zcq0j")' }}
                />
                <div className="p-4 flex flex-col gap-3">
                    <div>
                        <h3 className="text-foreground text-lg font-bold">Подбор по фильтру</h3>
                        <p className="text-muted-foreground text-sm">
                            Найдите идеальный автомобиль под ваши параметры и бюджет
                        </p>
                    </div>
                    <Link 
                        href="/filters" 
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Найти авто
                    </Link>
                </div>
            </div>
        </div>
    );
}
