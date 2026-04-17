import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Zap, TrendingDown } from 'lucide-react';

export default function OnboardingStep2() {
  return (
    <div className="bg-surface dark:bg-background font-body min-h-screen flex flex-col overflow-x-hidden text-on-surface dark:text-white">
      <header className="flex items-center justify-between px-6 py-4 w-full bg-surface/80 dark:bg-background/80 fixed top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/onboarding/step-1">
            <ArrowLeft className="text-primary w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-300" />
          </Link>
          <h1 className="font-headline font-extrabold tracking-tighter text-lg">HUBDrive</h1>
        </div>
        <Link href="/" className="font-headline tracking-tight font-bold text-lg text-primary hover:opacity-80 transition-opacity">Skip</Link>
      </header>

      <main className="flex-1 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl mb-12 flex flex-col md:flex-row items-center gap-12">
          
          <div className="relative w-full md:w-1/2 aspect-square group mt-8">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform -scale-110"></div>
            
            <div className="relative grid grid-cols-6 grid-rows-6 gap-4 h-full">
              <div className="col-span-4 row-span-3 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-6 flex flex-col justify-between border border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <Search className="text-primary w-8 h-8" />
                  <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-full">Active Scan</span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-3/4"></div>
                  </div>
                  <p className="text-[11px] font-label font-medium text-gray-500">Scanning Shanghai Market...</p>
                </div>
              </div>
              
              <div className="col-span-2 row-span-4 col-start-5 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-4 flex flex-col items-center justify-center text-center gap-3 border border-gray-200 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center">
                  <Zap className="text-primary w-6 h-6 fill-primary" />
                </div>
                <p className="text-xs font-bold leading-tight">98%<br/><span className="text-[10px] font-normal text-gray-500">Match</span></p>
              </div>
              
              <div className="col-span-3 row-span-3 row-start-4 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-5 border border-gray-200 dark:border-white/5">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-label font-bold text-gray-500 uppercase tracking-wider">Range</span>
                    <span className="text-[10px] font-bold text-primary">600+ km</span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                  </div>
                  <div className="pt-2 flex gap-1">
                    <div className="h-4 w-1/3 bg-primary/5 rounded"></div>
                    <div className="h-4 w-1/2 bg-primary/20 rounded"></div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 row-span-2 col-start-4 row-start-5 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-4 border border-gray-200 dark:border-white/5 flex items-center gap-3">
                <TrendingDown className="text-primary w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-label font-medium text-gray-500 uppercase">Best Price</span>
                  <span className="text-xs font-bold">$34,200</span>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <img alt="" className="w-96 h-96 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvnyGwZDAhhJKQ0zyEtjabpQcGhLB-rcQsSQCUHqwJxVhe9J271HlaCgVsVe84KDM3pvjq25DMPg2a6DDb4DTb8lAqRQ-iuLOoq3T7QUfGhOQkj70Exxgyq-UgQZwK-CSsw2kJfnESNaAuv8bqeKHxR7CkXz7dYlTw1e6jD1ZMBp8uVrv8eDQBfklLmRHKwZupt1tk0v--8aW6WC59eD20Aidur2C6RAQSV9ZbOISL24Y-QErcoMSDaacj15hDXYqK3l8ZuCXHmD6T"/>
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-label font-bold text-primary uppercase tracking-[0.2em]">Step 02 / 04</span>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-[1.1]">
                Умные фильтры и персональный подбор
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-body">
              Настройте поиск под свои задачи. Мы анализируем рынок Китая в реальном времени, чтобы найти именно ваш электромобиль по лучшей цене.
            </p>
            
            <div className="flex items-center gap-4 py-4 border-y border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="bg-primary rounded-full p-0.5"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                <span className="text-[11px] font-label font-bold uppercase tracking-wider text-gray-500">Real-time Data</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-primary-container"></div>
              <div className="flex items-center gap-2">
                <div className="bg-primary rounded-full p-0.5"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                <span className="text-[11px] font-label font-bold uppercase tracking-wider text-gray-500">AI Matching</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-12">
          <div className="h-1.5 w-12 bg-primary/20 rounded-full"></div>
          <div className="h-1.5 w-12 bg-primary-container rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
          <div className="h-1.5 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          <div className="h-1.5 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full px-6 pb-12 pt-6 bg-surface/80 dark:bg-background/80 backdrop-blur-[20px] z-40">
        <div className="container mx-auto max-w-md">
          <Link href="/onboarding/step-4" className="w-full flex justify-center bg-gradient-to-br from-primary to-primary-container text-white py-5 rounded-full font-headline font-bold text-lg shadow-[0px_12px_32px_rgba(157,67,0,0.2)] hover:translate-y-[-2px] active:scale-95 transition-all duration-300">
            Далее
          </Link>
        </div>
      </div>
    </div>
  );
}
