import Image from "next/image";
import Link from "next/link";
import { Menu, Factory, Eye, ShieldCheck, Banknote, ArrowRight, Activity, Car, Globe } from "lucide-react";

export default function WhyUsPage() {
  return (
    <div className="bg-background text-foreground min-h-[100dvh] pb-24 overflow-x-hidden selection:bg-orange-500/20 selection:text-foreground">
      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-sm px-6 h-16 flex justify-between items-center border-b border-border/40">
        <div className="flex items-center gap-3">
          <button className="text-primary hover:opacity-80 transition-opacity">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold tracking-[0.2em] text-primary uppercase font-sans">
            HUBDrive
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50 bg-muted">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPd0njGnkTUDpnjVi5F-v4PXDJkuFLheWaQ3m3jlIkuWEgGwsIC_Mwg103uznpZJrxaJUyWudLIJ6hZ5CJ_6okqHezKXSGY7YCFYIes-FQnUskKIKORDuYpddg0ANLdAC2tajpvY0dIKyjRyXtbA7vYzF8SjW8ckyg7r5Gzx_RydDcknhW1ZpQdr3M0DM3YP3stmQdOLDYVfULVx70GHq8fCVOjaE4s5EbVQ0gRTIejGh2QbJTBfgBoPlx9U_75G_Jfp9N1DmpW100" 
            alt="Профиль"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <main className="pt-24 px-6 md:px-12 max-w-4xl mx-auto">
        {/* Hero Branding Section */}
        <section className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-[2px] bg-gradient-to-r from-primary to-orange-500 rounded-full"></span>
            <span className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-primary">HUBDrive Advantage</span>
          </div>
          <h2 className="text-[2.25rem] md:text-5xl font-sans font-extrabold leading-tight tracking-tight mb-4 text-foreground">
            Почему выбирают HUBDrive?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-[90%] font-medium">
            Ваш надежный импортер электромобилей из Китая
          </p>
        </section>

        {/* Feature Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Direct Supplies */}
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 shadow-sm border border-border/50 group hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Factory className="text-primary w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-sans font-bold mb-2">Прямые поставки</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Работаем напрямую с производителями, чтобы гарантировать высочайшее качество и оригинальные запчасти.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center gap-2 text-primary text-sm font-bold group-hover:gap-3 transition-all cursor-pointer">
              <span className="uppercase tracking-widest text-xs">Подробнее</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Transparency */}
          <div className="bg-muted/50 rounded-2xl p-8 flex flex-col gap-6 border border-border/60 group hover:border-primary/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center shadow-sm">
              <Eye className="text-primary w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-sans font-bold mb-2">Полная прозрачность</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Отслеживание каждого этапа доставки автомобиля — от завода до ваших дверей в реальном времени.
              </p>
            </div>
            <div className="flex gap-1 mt-2">
              <div className="h-1.5 w-8 rounded-full bg-gradient-to-r from-primary to-orange-500"></div>
              <div className="h-1.5 w-4 rounded-full bg-border"></div>
              <div className="h-1.5 w-4 rounded-full bg-border"></div>
            </div>
          </div>

          {/* Card 3: Warranty */}
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 shadow-sm border border-border/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary to-orange-500 opacity-5 rounded-bl-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center relative z-10">
              <ShieldCheck className="text-primary w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-sans font-bold mb-2">Гарантия и сервис</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Официальная гарантия и техническое обслуживание в наших сервисных центрах.
              </p>
            </div>
          </div>

          {/* Card 4: Profitability */}
          <div className="bg-gradient-to-br from-primary to-orange-500 rounded-2xl p-8 text-primary-foreground flex flex-col gap-6 shadow-xl shadow-primary/20 md:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Banknote className="text-white w-8 h-8" />
            </div>
            <div>
              <div className="text-white/80 text-xs font-sans font-bold uppercase tracking-widest mb-1.5">Максимальная экономия</div>
              <h3 className="text-3xl md:text-4xl font-sans font-extrabold mb-3">Выгода до 30%</h3>
              <p className="text-white/90 leading-relaxed text-sm md:text-base max-w-md">
                Экономьте деньги по сравнению с местными дилерами за счет отсутствия посредников в цепочке поставок.
              </p>
            </div>
            <button className="bg-white text-primary px-6 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg self-start mt-2 hover:scale-105 active:scale-95 transition-transform">
              Рассчитать выгоду
            </button>
          </div>

        </div>

        {/* Ecosystem Footer */}
        <footer className="mt-16 text-center pb-8 border-t border-border/40 pt-8">
          <p className="text-muted-foreground/60 font-sans font-bold text-[10px] uppercase tracking-[0.3em]">
            Official partner ecosystem
          </p>
          <div className="flex justify-center gap-8 mt-6 opacity-30 grayscale items-center">
            <Car className="w-7 h-7" />
            <Activity className="w-6 h-6" />
            <Globe className="w-6 h-6" />
          </div>
        </footer>
      </main>
    </div>
  );
}
