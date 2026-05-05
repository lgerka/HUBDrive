import React from 'react';


export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface dark:bg-background overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/5 dark:bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 animate-[pulse_3s_ease-in-out_infinite]">
                <div className="flex items-center justify-center text-primary drop-shadow-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-16 w-16"
                    >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
                <div className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-md">
                    HUB<span className="text-primary">Drive</span>
                </div>
            </div>
            
            <div className="absolute bottom-16 flex gap-2 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_-0.3s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_-0.15s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-[bounce_1s_infinite_0s]"></div>
            </div>
        </div>
    );
}
