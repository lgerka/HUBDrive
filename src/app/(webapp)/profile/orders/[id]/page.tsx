import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Headset, 
  Route, 
  CheckCircle2, 
  Truck, 
  Package, 
  FileText, 
  Download, 
  Banknote, 
  MessageSquare, 
  Phone 
} from "lucide-react";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="bg-background text-foreground min-h-[100dvh] pb-32 overflow-x-hidden selection:bg-orange-500/20 selection:text-foreground">
      {/* TopAppBar */}
      <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border/40">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold font-sans">Детали сделки</h1>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50 bg-muted">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEoJ0J_MgOSjsRsZA1oYNX8_kwvTovhMs3QX1XuniX1VfEk3wiSUUKdkIb4do_eOaK23vaKgWLvaq4J36t5q9bIz42jbn5KsoFAanucWMLsReR_ZVamrxmbOnmNYr1JQquNcxmxgq4_PWq97VUdCuUrdBctc60odATzRaMH4ZyrpBwURi3v_n21JqvfkRrAttCu5NOaIWw4vJE_STKbElfQw9S8sgUMHanohXaybWCQ9e3ytJRIiM2YDNI1MSUU82lUwASbpp4GyMc" 
              alt="User" 
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-6 space-y-8">
        {/* Vehicle Hero Card */}
        <section className="relative overflow-hidden bg-card rounded-3xl p-6 transition-all border border-border/50 shadow-sm hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-sans text-2xl font-extrabold tracking-tight">Zeekr 001 FR</h2>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-0.5">VIN: ZEKR88203341LX</p>
            </div>
            <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <span className="text-xs font-bold text-primary uppercase tracking-tighter">В пути</span>
            </div>
          </div>
          
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-muted group border border-border/30">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpmo-0Kzwp029OXvY6Sx-CEmfjlMsGQrtopURfB8TfLdDbNHCX8RDASY-a7guB9jtBILVycyWDiZJ2jmWMVJ3QuZbueDKwnECngA9rbEgnoAPYSpycPtOpZx6tudyJiQFlf1MSLhsKtqtKAMwUDASmvTqX15j8Nhs2-IyoPBLsxSB39_1Dvo8goxLO7VT076XNWx7EVcRSfKKi1rGsudc-YkqGWO8PgSsRzwerBceTPOexwLnmmg-IB-vu6OEAhiHcKPAyIv4fTGWe" 
              alt="Zeekr 001 FR"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Сумма сделки</span>
              <p className="font-sans text-xl font-extrabold text-foreground">$102,400</p>
            </div>
            <button className="flex items-center gap-2 bg-primary hover:bg-orange-600 text-primary-foreground px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20">
              <Headset className="w-4 h-4" />
              <span className="text-sm font-bold">Связаться</span>
            </button>
          </div>
        </section>

        {/* Interactive Timeline (Visual Log) */}
        <section className="space-y-6 bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <h3 className="font-sans text-lg font-bold text-foreground flex items-center gap-2">
            <Route className="text-primary w-5 h-5" />
            Трекинг заказа
          </h3>
          
          <div className="relative space-y-0 pl-2 mt-6">
            {/* Vertical Line */}
            <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-border/60"></div>
            
            {/* Stage 1: Done */}
            <div className="relative flex items-start gap-5 pb-8 group">
              <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-card text-primary-foreground">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <p className="font-bold text-foreground">Договор подписан</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">12 Мая 2024, 14:20</p>
              </div>
            </div>

            {/* Stage 2: Done */}
            <div className="relative flex items-start gap-5 pb-8 group">
              <div className="relative z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-card text-primary-foreground">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <p className="font-bold text-foreground">Авто выкуплено в Китае</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">18 Мая 2024, 10:15</p>
              </div>
            </div>

            {/* Stage 3: Current */}
            <div className="relative flex items-start gap-5 pb-8 group">
              <div className="relative z-10 w-8 h-8 rounded-full bg-background flex items-center justify-center border-2 border-primary ring-4 ring-primary/10">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="pt-1">
                <p className="font-bold text-primary">На таможне</p>
                <p className="text-xs opacity-80 font-medium mt-1 text-primary">В процессе обработки</p>
              </div>
              <div className="ml-auto">
                <span className="bg-primary/10 px-2 py-1 rounded text-[10px] font-bold text-primary ring-1 ring-primary/20">LIVE</span>
              </div>
            </div>

            {/* Stage 4: Upcoming */}
            <div className="relative flex items-start gap-5 pb-8 group">
              <div className="relative z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center border-4 border-card">
                <Truck className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="pt-1 opacity-50">
                <p className="font-bold text-foreground">В пути в страну назначения</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Ожидаемая дата: 15 Июня</p>
              </div>
            </div>

            {/* Stage 5: Upcoming */}
            <div className="relative flex items-start gap-5 group">
              <div className="relative z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center border-4 border-card">
                <Package className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="pt-1 opacity-50 relative top-1">
                <p className="font-bold text-foreground">Готово к выдаче</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">HUB Center</p>
              </div>
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className="space-y-4">
          <h3 className="font-sans text-lg font-bold text-foreground px-1">Документы</h3>
          <div className="grid grid-cols-1 gap-3">
            {/* Doc 1 */}
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Договор купли-продажи</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">PDF • 2.4 MB</p>
                </div>
              </div>
              <Download className="text-primary w-5 h-5" />
            </div>

            {/* Doc 2 */}
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Инвойс на оплату</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">PDF • 1.1 MB</p>
                </div>
              </div>
              <Download className="text-primary w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Curator Card */}
        <section className="bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-3xl p-6 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/20">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoSnR3EWd8BzXkkx8QvXoMr0KKcVHIBLzrOSpjBAIkcdTeVb8yHetds177mKm8R9OgRCVQlkY2M7i0M6_RJTgqkFCiBJnm6-w4k6X58qjmWBxRmy5U5hz6z7XW3muPNuuUAlt9nw1pbEq2fRG1OjhI2foVwlNgscXumEyw8H_Il8jwtncIyG4TAAnTEdCwj7fOaMqAdpxK-phV2c-74if2jNO4ZS93NZoRbnevzO_x2Kp1nVCyfPlqTYdu5pl_bQg-M3RqeQ-A2t4H" 
                alt="Curator profile"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Ваш куратор</p>
              <p className="font-sans font-bold text-foreground">Александр Волков</p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-6 font-medium">
            Привет! Я сопровождаю вашу сделку. Если у вас есть вопросы по доставке или таможенному оформлению — пишите, я на связи.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-background border border-border/50 text-foreground py-3.5 rounded-xl text-sm font-bold shadow-sm hover:bg-muted transition-colors active:scale-95">
              <MessageSquare className="w-4 h-4 text-primary" />
              Написать
            </button>
            <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-colors active:scale-95">
              <Phone className="w-4 h-4" />
              Позвонить
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
