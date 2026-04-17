import Image from "next/image";
import Link from "next/link";
import { 
  Menu, 
  SlidersHorizontal, 
  Search, 
  Gavel, 
  Ship, 
  Truck, 
  Key, 
  ArrowRight 
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="bg-background text-foreground min-h-[100dvh] pb-24 overflow-x-hidden selection:bg-orange-500/20 selection:text-foreground relative">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 h-16 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button className="text-primary hover:opacity-80 transition-opacity">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold tracking-[0.2em] text-primary uppercase font-sans">
            HUBDrive
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border/50">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy0PIQXsWuvyZARF7upNuL0XZUSc5mjr0IlUEqptYFVsCXOrIaXWR-WbaGVsLnUNIqU3m4xirD8QIZJzJ-q9cm8dQWR9vCxs10deqWg5Eil8LmDUQPm9QWfInkM9YoT5EPUTGbPE9tQm4cOrKGQ-exEtdZkeWvtRZa603u8AXA3hUPSpuHjpfWCdrDabD2BXz8-nC8vcbcVCIklpr7ZLwf2Lbt1V4ih-dTwehFbonDfyYBLYtgcWsxBCp0KszHDmsE9Ct-j-uCMB_H" 
            alt="Profile" 
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto">
        {/* Hero Section */}
        <section className="mb-12">
          <h2 className="font-sans text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            Как это работает?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed opacity-90 font-medium">
            Простой путь к вашему новому автомобилю
          </p>
        </section>

        {/* Timeline Stepper */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary to-orange-500 opacity-20 rounded-full"></div>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center z-10 shadow-lg shadow-primary/20">
                <SlidersHorizontal className="text-primary-foreground w-5 h-5" />
              </div>
              {/* Connector Circle */}
              <div className="absolute left-[22px] top-[14px] w-3 h-3 rounded-full bg-orange-500 ring-4 ring-background z-20"></div>
              
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 transition-shadow hover:shadow-md">
                <h3 className="font-sans text-xl font-bold text-foreground mb-2">Создайте фильтр</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Укажите параметры автомобиля вашей мечты: марку, модель, комплектацию и бюджет.</p>
                <div className="mt-4 flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-full">Параметры</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-full">Бюджет</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background flex items-center justify-center z-10 shadow-sm border border-border/70 group-hover:border-primary/50 transition-colors">
                <Search className="text-primary w-5 h-5" />
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                <h3 className="font-sans text-xl font-bold text-foreground mb-2">Подбор вариантов</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Мы находим лучшие предложения на аукционах и у дилеров в Китае, предоставляя полный отчет.</p>
                <div className="mt-5 h-32 rounded-xl overflow-hidden relative border border-border/30">
                  <Image 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8Y-HY3ItGEoJNHmf_9G520v5XKJS0Y4WgNWKQskLKj5mpTg23rbpaArBUHl1vp9J05OWtMvYm9EfTu2s_ckdz3xtODUyD5X_TjIQmleao2ee18IS0NU3i2-sLsfrERfS-o3CkGa7HEE8cWMJs_E0x3bzYvFhEoDzELrvfYUSD4zavX7KeGNRGBwSd61FhFWcaixnyDrRB9emEuzThwKlCIwVcbD7Ht_usbliy5EyJLivFy5qEIBcQqbXYvCKazZCECDv-Lj4hRbsJ" 
                    alt="Car Showroom"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background flex items-center justify-center z-10 shadow-sm border border-border/70">
                <Gavel className="text-primary w-5 h-5" />
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                <h3 className="font-sans text-xl font-bold text-foreground mb-2">Договор и оплата</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Заключение официального договора и безопасная оплата через банк с гарантией защиты сделки.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background flex items-center justify-center z-10 shadow-sm border border-border/70">
                <Ship className="text-primary w-5 h-5" />
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                <h3 className="font-sans text-xl font-bold text-foreground mb-2">Доставка и таможня</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Мы берем на себя всю логистику, оформление документов и прохождение таможни под ключ.</p>
                <div className="mt-4 flex items-center gap-3 py-3 border-t border-border/50">
                  <Truck className="text-primary/70 w-4 h-4" />
                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Отслеживание 24/7</span>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative pl-16">
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background flex items-center justify-center z-10 shadow-sm border border-border/70">
                <Key className="text-primary w-5 h-5" />
              </div>
              
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                <h3 className="font-sans text-xl font-bold text-foreground mb-2">Получение ключей</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">Заберите ваш автомобиль в нашем центре или мы доставим его прямо к вашему дому.</p>
                <Link 
                  href="/catalog" 
                  className="mt-6 w-full py-4 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground rounded-full font-sans font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md group"
                >
                  Начать подбор
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
