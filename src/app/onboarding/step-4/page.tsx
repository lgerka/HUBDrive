import React from 'react';
import Link from 'next/link';
import { Shield, Home, Package, Navigation, ArrowLeft } from 'lucide-react';

export default function OnboardingStep4() {
  return (
    <div className="bg-surface dark:bg-background font-body text-on-surface dark:text-white antialiased overflow-x-hidden min-h-screen">
      <nav className="bg-surface/80 dark:bg-background/80 backdrop-blur-xl fixed w-full top-0 z-50 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/onboarding/step-2">
            <ArrowLeft className="text-primary w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-300" />
          </Link>
          <span className="font-headline font-extrabold text-lg tracking-tight uppercase">HUBDrive</span>
        </div>
        <Link href="/" className="text-gray-500 font-body text-sm uppercase tracking-widest hover:opacity-70 transition-opacity duration-300">
          Skip
        </Link>
      </nav>

      <main className="min-h-screen flex flex-col pt-24 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
        <section className="flex-grow flex flex-col justify-center gap-12 mt-4">
          <div className="relative w-full aspect-[4/3] rounded-xl bg-[#1A1C1E] overflow-hidden shadow-sm">
            <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCqT5qlo37WSgb-LX7mj1KL3I5o5fPh94oVNueVfm_hjU7zLYOWyowU16A4q4y-55aM9V013kEizn5po-gEnW7OdviO7dhFELUPRoPSBcDOYKfKgPnCoXhcguUA0pGV8LEJPc1_HKSQfN4YHFfBueth_ttLZ2Fk89-CA8MNIopOnKWrG--g8V_u6TQsZPYdVyVWKnNOrkzudQkTCvyNhakPBGA-VIS9_n6VC8px1nCVheUvOg7W_tLp9gHhV5A6zw3fBLFmz6AZ1XL')"}}>
            </div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-white/90 dark:bg-black/90 backdrop-blur p-4 rounded-xl shadow-sm text-black dark:text-white">
                  <span className="block font-label text-[0.6875rem] text-primary uppercase tracking-widest mb-1">Status</span>
                  <span className="block font-headline font-bold">In Transit</span>
                </div>
                <div className="bg-white/90 dark:bg-black/90 backdrop-blur p-4 rounded-xl shadow-sm text-right text-black dark:text-white">
                  <span className="block font-label text-[0.6875rem] text-primary uppercase tracking-widest mb-1">ETA</span>
                  <span className="block font-headline font-bold">Nov 24</span>
                </div>
              </div>
              
              <div className="relative py-12">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-0 w-[75%] h-[2px] bg-gradient-to-r from-primary to-primary-container -translate-y-1/2 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                
                <div className="relative flex justify-between">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black border-2 border-primary-container flex items-center justify-center z-10 shadow-sm">
                      <Package className="text-primary w-5 h-5" />
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-tighter text-white font-bold">Auction</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black border-2 border-primary-container flex items-center justify-center z-10 shadow-sm">
                      <Navigation className="text-primary w-5 h-5" />
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-tighter text-white font-bold">Shipping</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 -mt-1 rounded-full bg-primary-container flex items-center justify-center z-10 shadow-[0_0_15px_rgba(249,115,22,0.8)] ring-4 ring-primary-container/20">
                      <Shield className="text-white w-6 h-6 fill-white" />
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-tighter text-primary font-extrabold drop-shadow">Customs</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-white/30 flex items-center justify-center z-10">
                      <Home className="text-gray-400 w-5 h-5" />
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-center md:text-left">
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Отслеживайте <br/>
              <span className="text-primary-container">каждый этап</span>
            </h1>
            <p className="font-body text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl mx-auto md:mx-0">
              Мы показываем весь путь вашего авто: от выкупа на аукционе до прохождения таможни. Полная прозрачность в реальном времени.
            </p>
          </div>
        </section>

        <footer className="mt-auto pt-8 flex flex-col gap-10">
          <div className="flex justify-center md:justify-start gap-3 items-center">
            <div className="h-1.5 w-4 rounded-full bg-primary/20"></div>
            <div className="h-1.5 w-4 rounded-full bg-primary/20"></div>
            <div className="h-1.5 w-12 rounded-full bg-primary-container transition-all duration-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
            <div className="h-1.5 w-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/onboarding/step-3" className="w-full sm:w-auto px-12 py-5 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-full shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300 uppercase tracking-wider text-sm text-center">
              Далее
            </Link>
            <Link href="/" className="w-full sm:w-auto px-8 py-5 text-gray-500 font-body font-bold hover:text-primary transition-colors duration-300 uppercase tracking-widest text-xs text-center">
              Пропустить всё
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
