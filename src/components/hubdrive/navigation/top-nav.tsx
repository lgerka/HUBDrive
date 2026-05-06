'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function TopNav() {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#f8f9fb]/80 dark:bg-[#191c1e]/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
            <div className="flex items-center justify-between px-4 py-1 max-w-7xl mx-auto relative">
                <div 
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    <Image src="/hub-drive-logo.png" alt="HUBDrive" width={72} height={32} className="object-contain" priority />
                </div>
                <div className="flex items-center gap-4">
                    {/* Bell icon removed as per user request */}
                </div>
                <div className="bg-[#f3f4f6] dark:bg-[#2c2e30] h-[1px] w-full absolute bottom-0 left-0 opacity-20"></div>
            </div>
        </header>
    );
}
