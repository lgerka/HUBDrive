import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function OnboardingStep1() {
  return (
    <div className="bg-surface dark:bg-background text-on-surface dark:text-white font-body min-h-screen flex flex-col overflow-hidden">
      <header className="bg-surface/80 dark:bg-background/80 backdrop-blur-md fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="text-primary w-6 h-6 fill-primary" />
          <span className="text-xl font-extrabold tracking-tighter text-primary font-headline">HUBDrive</span>
        </div>
        <Link href="/" className="font-headline font-bold tracking-tight text-gray-400 hover:opacity-80 transition-opacity active:scale-95 duration-200">
          Skip
        </Link>
      </header>

      <main className="flex-grow flex flex-col relative pt-16">
        <div className="absolute inset-0 z-0 h-[618px]">
          <div className="relative w-full h-full overflow-hidden">
            <img className="w-full h-full object-cover scale-110" alt="Sleek white futuristic electric car" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7KjFzPbRm68Q-pUXfOg5QrVlcESBEnEYYx5ewMvA3f88ysCED3JMVQ2-onOaOWBdTTxM6iVCnjURk3_0S64v5_ZoLgPmVDDnmliYLdnSyQB9PHzCxEbFwjXixpsmLq-08J497MIkhtQdhUFQAqOWlzAkkKiH5hx2tO-glUrNGn8bjVRI--3GRQTduS6M7s72LklnVCgP3vCt6Hn7fj7G4VHCcsN7SzLxLuzjpT8dAhgJguaKCbGs3W3j-6SwYXDT6E2I7NMQeEoLH" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/70 to-surface dark:via-background/70 dark:to-background"></div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-end flex-grow px-8 pb-32">
          <div className="max-w-2xl">
            <div className="flex gap-2 mb-8 items-center">
              <div className="h-1.5 w-12 rounded-full bg-primary"></div>
              <div className="h-1.5 w-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="h-1.5 w-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="h-1.5 w-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            </div>

            <h1 className="font-headline text-[3.5rem] leading-[1.1] font-extrabold tracking-tight mb-6">
              Мир премиальных <br/><span className="text-primary italic">авто</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-body max-w-md leading-relaxed mb-12">
              Откройте для себя лучшие модели из Китая с полной поддержкой на каждом этапе — от выбора до доставки.
            </p>

            <div className="flex items-center justify-between gap-6">
              <Link href="/onboarding/step-2" className="bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold text-lg px-12 py-5 rounded-full shadow-lg flex items-center gap-3 active:scale-95 transition-all duration-300">
                Далее
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="hidden md:flex items-center gap-4 text-xs font-label tracking-widest text-primary uppercase">
                <span>Luxury</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span>Innovation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span>Direct Import</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="h-20 bg-surface-container-low dark:bg-[#1A1C1E] flex items-center justify-center px-8">
        <div className="flex items-center gap-2 opacity-40">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-label font-medium">Official HUBDrive Partner Ecosystem</span>
        </div>
      </div>
    </div>
  );
}
