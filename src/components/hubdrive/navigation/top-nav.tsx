import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

import Image from 'next/image';

export function TopNav() {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#f8f9fb]/80 dark:bg-[#191c1e]/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
            <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative">
                <div className="flex items-center gap-4 mix-blend-multiply dark:mix-blend-normal">
                    <Image src="/hub-drive-logo.png" alt="HUBDrive" width={140} height={32} className="object-contain" priority />
                </div>
                <div className="flex items-center gap-4">
                    <Bell className="text-[#191c1e] dark:text-[#f8f9fb] hover:opacity-80 transition-opacity cursor-pointer w-6 h-6" />
                </div>
                <div className="bg-[#f3f4f6] dark:bg-[#2c2e30] h-[1px] w-full absolute bottom-0 left-0 opacity-20"></div>
            </div>
        </header>
    );
}
