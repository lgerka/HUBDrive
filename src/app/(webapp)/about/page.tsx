import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Banknote, 
  ShieldCheck, 
  Headset, 
  MapPin, 
  Clock 
} from "lucide-react";

export default function AboutPage() {
  const showroomImage = "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop";

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-950 font-sans selection:bg-primary/30">
      {/* Full-width immersive cover */}
      <div className="absolute top-0 left-0 w-full h-[50vh] min-h-[400px] z-0">
          <Image 
              src={showroomImage}
              alt="HUBDrive Showroom"
              fill
              className="object-cover"
              priority
          />
          {/* Subtle overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-950" />
      </div>

      {/* Floating Navigation */}
      <div className="fixed top-0 w-full z-50 px-4 pt-4 pb-2 flex justify-between items-center backdrop-blur-md bg-gradient-to-b from-slate-950/80 to-transparent">
          <Link 
              href="/"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xl transition-all active:scale-95"
          >
              <ArrowLeft className="w-5 h-5" />
          </Link>
      </div>

      {/* Scrolling Content Fold */}
      <main className="relative z-10 pt-[35vh] pb-24 w-full max-w-2xl mx-auto">
          <article className="bg-surface rounded-t-[2.5rem] min-h-[65vh] w-full shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
              {/* Header Box */}
              <div className="px-6 pt-10 pb-8 relative">
                  <h1 className="font-sans font-extrabold text-4xl tracking-tight text-primary mb-2">
                    HUBDrive
                  </h1>
                  <p className="text-muted-foreground font-sans text-lg font-medium leading-relaxed max-w-sm">
                    Ваш надежный партнер в мире премиальных электромобилей.
                  </p>
              </div>

              {/* Facts Bento Grid */}
              <div className="px-6 pb-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/20 flex flex-col justify-between aspect-[1.3/1]">
                    <span className="text-foreground font-sans font-extrabold text-3xl">5+</span>
                    <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-[0.1em] leading-tight">лет<br/>на рынке</span>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/20 flex flex-col justify-between aspect-[1.3/1]">
                    <span className="text-foreground font-sans font-extrabold text-3xl">1000+</span>
                    <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-[0.1em] leading-tight">машин<br/>в наличии</span>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/20 flex flex-col justify-between aspect-[1.3/1]">
                    <span className="text-foreground font-sans font-extrabold text-3xl">2 <span className="text-2xl">года</span></span>
                    <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-[0.1em] leading-tight">Официальная<br/>Гарантия</span>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/20 flex flex-col justify-between aspect-[1.3/1]">
                    <span className="text-foreground font-sans font-extrabold text-3xl">14 <span className="text-2xl">дн</span></span>
                    <span className="text-muted-foreground text-[10px] font-sans font-bold uppercase tracking-[0.1em] leading-tight">Доставка<br/>под заказ</span>
                  </div>
                </div>
              </div>

              {/* Advantages Section */}
              <div className="px-6 pb-12">
                <h3 className="font-sans font-extrabold text-xl text-foreground mb-6">Почему мы?</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-surface-container-low text-primary transition-all duration-300 shadow-sm group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-sans font-extrabold text-sm text-foreground">Прозрачное ценообразование</p>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Никаких скрытых комиссий и сборов</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-surface-container-low text-primary transition-all duration-300 shadow-sm group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-sans font-extrabold text-sm text-foreground">Полное таможенное оформление</p>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Берем на себя всю бумажную работу</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-surface-container-low text-primary transition-all duration-300 shadow-sm group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                      <Headset className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-sans font-extrabold text-sm text-foreground">Личный менеджер 24/7</p>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Связь и поддержка на каждом этапе</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Card */}
              <div className="px-6 pb-6">
                <div className="bg-surface-container-low rounded-3xl p-8 space-y-6 border border-border/30">
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-surface rounded-full shadow-sm text-primary shrink-0">
                         <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans font-extrabold text-sm text-foreground">Алматы, пр. Аль-Фараби, 77/8</p>
                        <p className="text-muted-foreground text-xs mt-1 font-medium">Esentai Tower, 12 этаж</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-surface rounded-full shadow-sm text-primary shrink-0">
                         <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans font-extrabold text-sm text-foreground">Ежедневно с 10:00 до 20:00</p>
                        <p className="text-muted-foreground text-xs mt-1 font-medium">Работаем без перерывов и выходных</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-4 mt-2 rounded-[1.25rem] bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-sans font-bold text-sm shadow-md active:scale-95 transition-all">
                    Связаться с нами
                  </button>
                </div>
              </div>
          </article>
      </main>
    </div>
  );
}
