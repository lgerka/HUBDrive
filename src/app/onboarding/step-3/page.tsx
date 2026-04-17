import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, UserCircle, Headset, ArrowRight } from 'lucide-react';

export default function OnboardingStep3() {
  return (
    <div className="bg-surface dark:bg-background font-body text-on-surface dark:text-white min-h-screen selection:bg-primary-container selection:text-white">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-surface/80 dark:bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/onboarding/step-4">
            <ArrowLeft className="text-primary w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-300" />
          </Link>
          <span className="font-headline font-extrabold tracking-tighter text-lg">HUBDrive</span>
        </div>
        <Link href="/" className="text-gray-500 font-headline tracking-tight font-bold text-lg hover:opacity-80 transition-opacity">Skip</Link>
      </header>

      <main className="min-h-screen pt-24 pb-32 px-6 flex flex-col items-center justify-center max-w-5xl mx-auto">
        <div className="mb-12 flex gap-2">
          <div className="h-1.5 w-12 rounded-full bg-primary/20"></div>
          <div className="h-1.5 w-12 rounded-full bg-primary/20"></div>
          <div className="h-1.5 w-12 rounded-full bg-primary/20"></div>
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary to-primary-container shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative group mt-8">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl"></div>
            <div className="relative bg-white dark:bg-[#1A1C1E] rounded-[2rem] p-4 shadow-[0px_12px_32px_rgba(25,28,30,0.04)] overflow-hidden border border-gray-100 dark:border-white/5">
              <div className="aspect-square rounded-[1.5rem] bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary to-primary-container"></div>
                
                <div className="absolute top-1/4 right-1/4 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/20">
                  <MessageSquare className="text-primary w-8 h-8" />
                </div>
                
                <div className="absolute bottom-1/3 left-1/4 p-6 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-3xl shadow-md border border-gray-200 dark:border-white/20">
                  <UserCircle className="text-primary-container w-10 h-10" />
                </div>
                
                <img alt="Manager" className="w-full h-full object-cover mix-blend-overlay grayscale opacity-40 dark:opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Kos9iCK94LhvSfijt6Lit-NrdkkFUZcMncb4r5ugMht6wxveps81JrxLD1SaYaAelJ9M7gT4Qr3FPey_ToFmBsfIHj3oYMxusPNfLytVh20dF76RxPK1yRofQCA55BkS3Fo2fyq1wyCEfUBB-RJaOIG32JzM0l8IT9B-axG3lKG6e4pT19FoBPhAwsqznLM8dTt5gWb7ULBkmAN_NhqPfqMDHNNGvua_gIO1eus-YY88Wz0vQt31FIgQldrbSZ4gr_2I1vMyFrZm"/>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Headset className="w-24 h-24 text-primary/30 dark:text-primary/10" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 px-6 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-label font-bold uppercase tracking-widest text-gray-500">Manager Online</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-label font-bold uppercase tracking-[0.1em] text-primary">Шаг 04 / 04: Финал</span>
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-[-0.03em] leading-tight">
                Ваш путь к <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">новому авто</span>
              </h1>
              <p className="font-body text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
                Получайте уведомления о новых поступлениях и общайтесь с личным менеджером прямо в Telegram. Мы берем на себя все заботы по доставке и оформлению.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gray-500">Telegram Bot</span>
              <div className="w-1 h-1 rounded-full bg-primary-container"></div>
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gray-500">Personal Manager</span>
              <div className="w-1 h-1 rounded-full bg-primary-container"></div>
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gray-500">Full Logistics</span>
            </div>

            <div className="pt-4">
              <Link href="/" className="bg-gradient-to-br from-primary to-primary-container text-white px-12 py-5 rounded-full font-headline font-bold text-lg shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center sm:justify-start w-fit gap-3 group">
                Начать покупать
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
