"use client";

import { Settings } from "lucide-react";

export function ProfileHeader() {
    return (
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-low transition-colors duration-300">
            <div className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto">
                <div className="w-10 h-10"></div> {/* Spacer for balance */}
                <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Профиль</h1>
                <div className="flex items-center gap-4">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-200">
                        <Settings className="w-6 h-6 text-primary" />
                    </button>
                </div>
            </div>
        </header>
    );
}
