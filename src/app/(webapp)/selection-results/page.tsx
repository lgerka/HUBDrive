import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  SlidersHorizontal, 
  Heart, 
  Zap,
  Phone
} from "lucide-react";

export default function SelectionResultsPage() {
  return (
    <div className="bg-background text-foreground min-h-[100dvh] pb-32 overflow-x-hidden selection:bg-orange-500/20 selection:text-foreground">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-sm border-b border-border/40">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="active:scale-95 transition-transform duration-200 text-foreground hover:text-primary">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold font-sans tracking-tight">Результаты подбора</h1>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50 bg-muted">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC184lPpf3ReTrEyDw5YEeJuiH9avea_bQSI9aZL51sW67FiFOxF9Phlu37cHNIK4IBF0q28YzhcNhHT2PEZxDPUWavFMp635m_iL4HVC4ipOg__OcuE7u9dtooWlkEpdRSZgfRF29dVdR1aCWOCJw9T8gSPnHRqtMb-OjNi7AlA_jMVdj13JYkGvAMoV1iAd5E5aHJOwDxr1dO9cLwWp3eKA7fzdUq_gDSm6das_S0cPSKFL2CgS8P--kbIH_TNQTsSlPjFz8swPhq" 
              alt="Profile" 
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="pt-20 px-6 max-w-md mx-auto">
        {/* Filter Summary Section */}
        <section className="mb-8 mt-4">
          <div className="bg-muted/50 border border-border/60 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground mb-1">Ваш фильтр</p>
              <p className="text-sm font-bold text-foreground">Zeekr, 2023+, до 15 млн ₸</p>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-background shadow-sm border border-border/50 hover:bg-muted transition-colors active:scale-95">
              <SlidersHorizontal className="text-primary w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Search Results Count */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-sans text-2xl font-extrabold tracking-tight">Найдено 12 авто</h2>
          <p className="text-xs font-sans text-muted-foreground font-medium">Сортировка: По релевантности</p>
        </div>

        {/* Car Cards Grid */}
        <div className="space-y-6">
          {/* Card 1: Zeekr 001 */}
          <article className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
            <div className="relative h-56 w-full bg-muted">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsraxkFub0L70bH2WKP7qw52lWeiAYEGZOeaHcZti3aCD_TappjjT1q-SvNaG4XBnvlp66zMvarLQl-IrW-eKX30f9WIOeONfnNnhOAo-3kmtTKHaVFY2IYhAx1zMNw1PGF_X3c0j1-MOmGclH-iiQu2hSWiV6kcurfglzkhQ0zZEuV8OrDiNFkFacPrahTPO8_NxJgpOzlmpLouQauiDYUUmn19gVczI6-JzZc6jA5qUw-n1pwEs--4m34kEaQGLT_-wHptmX6qOU" 
                alt="Zeekr 001"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-orange-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold font-sans uppercase tracking-wider">98% совпадение</span>
              </div>
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-sans text-xl font-bold tracking-tight mb-1">Zeekr 001 You</h3>
                  <p className="text-sm font-sans text-muted-foreground font-medium">2023 • Новое состояние</p>
                </div>
                <p className="font-sans text-lg font-extrabold text-primary tracking-tight">14 200 000 ₸</p>
              </div>
              
              {/* Spec-Strip */}
              <div className="flex items-center gap-3 py-3 border-y border-border/50 overflow-x-auto no-scrollbar scrollbar-hide flex-nowrap">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">544 л.с.</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">3.8 сек до 100</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">600 км запас</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">AWD</span>
              </div>
              
              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-primary to-orange-500 text-white py-4 rounded-full font-bold text-sm tracking-wide active:scale-95 transition-transform hover:opacity-95 shadow-md shadow-primary/20">
                  Подробнее о предложении
                </button>
              </div>
            </div>
          </article>

          {/* Card 2: Zeekr X */}
          <article className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
            <div className="relative h-56 w-full bg-muted">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHf7-KifJYKM9QXIhsAF-WA8r_qapO5EKmWPAYNJqjIYfr52qYEKdS4h4DCV2q0tnJgwPuK8pf4foCy4LTIp5lhANkDDnLWeoHNHEKOe-bqK--6gXA_cn37tzyA8DrSK7kV-6SNvk-0hcmbLBLwDy_6DbFl71cgHJlfaVh-9bzJSdaLxKeRny0-eSgHbNxzW8OsrQH9BZawWL5iqsLzpA2NucwYFlhI_P9cD_Dpa4BJWBudBjrXeqaHq3fazA_2gKnX40ARZKhnNLV" 
                alt="Zeekr X"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-orange-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold font-sans uppercase tracking-wider">92% совпадение</span>
              </div>
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-sans text-xl font-bold tracking-tight mb-1">Zeekr X Flagship</h3>
                  <p className="text-sm font-sans text-muted-foreground font-medium">2024 • Под заказ</p>
                </div>
                <p className="font-sans text-lg font-extrabold text-primary tracking-tight">11 800 000 ₸</p>
              </div>
              
              {/* Spec-Strip */}
              <div className="flex items-center gap-3 py-3 border-y border-border/50 overflow-x-auto no-scrollbar scrollbar-hide flex-nowrap">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">428 л.с.</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">5.8 сек до 100</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">512 км запас</span>
              </div>
              
              <div className="mt-6">
                <button className="w-full border border-primary/30 hover:bg-muted text-foreground py-4 rounded-full font-bold text-sm tracking-wide active:scale-95 transition-all">
                  Проверить наличие
                </button>
              </div>
            </div>
          </article>

          {/* Card 3: Zeekr 009 */}
          <article className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
            <div className="relative h-56 w-full bg-muted">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB67ro-MnsiggfrYp7g4Mqe7yFeX0FwEYPonN5Z6nzLDLRwZluJxVIdibklwJCsGcoGPj__Y_rZJOh0Z4-TpavGU03bZK-RuKgGuwfL7ehlqQ-6IH8vBFYjB54IMLGrUqsdFq9bg8bSPFuSKhjYDC9rqRA1WRE7MCOlZaLuh93PUYWqLarrX1uZy8jFvyqd-m-2nCV2S5s8NtsG0WwYHvyq0a-F5ro2tolYYF3Fhqk0NsEz64GtRtMcOSDKulSSWGavpPm8g3uuPbSR" 
                alt="Zeekr 009"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-orange-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold font-sans uppercase tracking-wider">85% совпадение</span>
              </div>
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-sans text-xl font-bold tracking-tight mb-1">Zeekr 009 WE</h3>
                  <p className="text-sm font-sans text-muted-foreground font-medium">2023 • В наличии</p>
                </div>
                <p className="font-sans text-lg font-extrabold text-primary tracking-tight">14 950 000 ₸</p>
              </div>
              
              {/* Spec-Strip */}
              <div className="flex items-center gap-3 py-3 border-y border-border/50 overflow-x-auto no-scrollbar scrollbar-hide flex-nowrap">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">544 л.с.</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">702 км запас</span>
                <div className="w-1 h-1 rounded-full bg-primary/50 shrink-0"></div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap">Executive</span>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button className="flex-1 border border-primary/30 hover:bg-muted text-foreground py-4 rounded-full font-bold text-sm tracking-wide active:scale-95 transition-all">
                  Детали
                </button>
                <button className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-primary/20">
                  <Phone className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
