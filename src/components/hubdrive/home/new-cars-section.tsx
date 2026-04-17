import React from 'react';
import { ChevronRight, PlusCircle } from 'lucide-react';

export function NewCarsSection() {
    return (
        <section className="mb-12 overflow-hidden">
            <div className="px-6 flex justify-between items-end mb-6 max-w-7xl mx-auto">
                <div>
                    <span className="font-label text-primary font-bold tracking-widest uppercase">В наличии</span>
                    <h3 className="font-headline text-2xl font-extrabold">Новинки каталога</h3>
                </div>
                <div className="text-primary font-bold flex items-center gap-1 cursor-pointer">
                    <span>Смотреть все</span> 
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
            
            <div className="flex overflow-x-auto gap-6 px-6 no-scrollbar snap-x snap-mandatory pb-4">
                {/* Zeekr Card */}
                <div className="snap-start min-w-[280px] md:min-w-[340px] bg-surface-container-lowest rounded-xl overflow-hidden group shadow-[0px_8px_24px_rgba(25,28,30,0.02)] border border-surface-container-low">
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt="Zeekr 001" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuV7p1Mnp7DtJH6n7PMW83u0hO9C8MLtoqRh0J1Huu0wra7q_wqnWnCVBtPZI-BADXp3rOCIclZjDbCwF0DVbUPphyUXNkENp2iKO99YJt_VWrmnVWqyWy3mThSWrLJoKNgUgJdIDJ-L2s4FIfJMDtXEvyXnfhFyhbgKrH2vdUZpG-8T3mPJyRg-Fb4vmAQHwFODmQxnqkb_8zJvQdIjrazkvR-haHhqjkVECvZOUVSYT1wYFkfwrNdvIbeEuEzJXpmER0uIU9S9zY"
                        />
                        <div className="absolute top-4 left-4 bg-on-surface/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface">2024</div>
                    </div>
                    <div className="p-5">
                        <h4 className="font-headline text-lg font-bold mb-1 line-clamp-1">Zeekr 001 Performance</h4>
                        <div className="flex items-center gap-2 mb-4 text-xs font-label uppercase text-on-surface/40">
                            <span>100 kWh</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>AWD</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>544 HP</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-base font-bold text-on-surface">от 12 500 000 ₸</span>
                            <PlusCircle className="text-primary-container cursor-pointer hover:scale-110 transition-transform w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Li L9 Card */}
                <div className="snap-start min-w-[280px] md:min-w-[340px] bg-surface-container-lowest rounded-xl overflow-hidden group shadow-[0px_8px_24px_rgba(25,28,30,0.02)] border border-surface-container-low">
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt="Li Auto L9" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIeF9TQBkdlIss8tiGP8iV8E_AdxO-1-gOBoQVGyo09ljvItl6khDzED9Z-c7Rwubl1uqTlbzCT84NlwFbcM5Dn3_oldKfowv0d8CtG4r-UNlCcjkdfZjgPnZJvNyqew4SD92DFnmen5-c-dvn2mqXp-SBUt3cLfXONPtmq-RMY5CT_njJcIr9sA2IAOKpgTR58qikWzR3JHWmbS3uVR8C1eHPwhdwTS9fhmWQMAo5s7vrZvyjJhOcQqm3iaNay680Glpv682pwlGm"
                        />
                        <div className="absolute top-4 left-4 bg-on-surface/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface">2024</div>
                    </div>
                    <div className="p-5">
                        <h4 className="font-headline text-lg font-bold mb-1 line-clamp-1">Li Auto L9 Ultra</h4>
                        <div className="flex items-center gap-2 mb-4 text-xs font-label uppercase text-on-surface/40">
                            <span>Гибрид</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>Luxury</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>6 Мест</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-base font-bold text-on-surface">от 18 200 000 ₸</span>
                            <PlusCircle className="text-primary-container cursor-pointer hover:scale-110 transition-transform w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* BYD Han Card */}
                <div className="snap-start min-w-[280px] md:min-w-[340px] bg-surface-container-lowest rounded-xl overflow-hidden group shadow-[0px_8px_24px_rgba(25,28,30,0.02)] border border-surface-container-low">
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt="BYD Han" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNYXwARIJC1TDEJcgViJv7H3Ziki3JwXd8_aCMwdZ9Nobb_XEMiulA0TJrxFr1_pZCKXOnevFaM0nNAjiPayCtLrX0S-7EAIXrIC58HWBEgMYl3YgVlns6ICX7AGo9AYdzl447cLH0rtwKlQlZtwEBcqCXczzRO9WlxfmB3lgd5r3vysk2tw0GDuxZnXajnNtJWEhSSGJzBVn5RO5RlUeWf4lV_PKsUykfbPFp4fLrMaY3nW071btaPx--TSDTp9n5HLmfWFpyYH1M"
                        />
                        <div className="absolute top-4 left-4 bg-on-surface/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface">2024</div>
                    </div>
                    <div className="p-5">
                        <h4 className="font-headline text-lg font-bold mb-1 line-clamp-1">BYD Han EV</h4>
                        <div className="flex items-center gap-2 mb-4 text-xs font-label uppercase text-on-surface/40">
                            <span>Флагман</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>715 КМ</span>
                            <span className="w-1 h-1 bg-primary-container rounded-full"></span>
                            <span>Кожа Nappa</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-base font-bold text-on-surface">от 14 000 000 ₸</span>
                            <PlusCircle className="text-primary-container cursor-pointer hover:scale-110 transition-transform w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
