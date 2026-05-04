import React from 'react';
import Image from 'next/image';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8f9fb] dark:bg-[#131313] overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative w-64 h-64 animate-[pulse_3s_ease-in-out_infinite] z-10 drop-shadow-2xl">
                <Image 
                    src="/hub-drive-logo.png" 
                    alt="HUBDrive Logo" 
                    fill 
                    className="object-contain mix-blend-multiply dark:mix-blend-normal dark:invert" 
                    priority 
                />
            </div>
            
            <div className="absolute bottom-16 flex gap-2 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_-0.3s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_-0.15s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_0s]"></div>
            </div>
        </div>
    );
}
