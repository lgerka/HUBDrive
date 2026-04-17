"use client";

import Image from "next/image";

interface ProfileUserInfoProps {
    name?: string;
    phone?: string;
    avatarUrl?: string; 
    onEdit?: () => void;
}

export function ProfileUserInfo({ 
    name = "Гость", 
    phone = "Телефон не указан", 
    avatarUrl, 
    onEdit 
}: ProfileUserInfoProps) {
    // Initials for avatar fallback
    const initials = name
        .split(" ")
        .map(n => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "Г";

    return (
        <section className="bg-surface-container-lowest rounded-3xl p-8 flex flex-col items-center text-center shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
            <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50"></div>
                {avatarUrl ? (
                    <Image 
                        src={avatarUrl} 
                        alt={name} 
                        fill 
                        className="object-cover relative z-10" 
                    />
                ) : (
                    <span className="font-headline font-bold text-3xl text-primary tracking-tighter relative z-10">
                        {initials}
                    </span>
                )}
            </div>
            
            <h2 className="font-headline font-extrabold text-2xl mb-1 text-on-surface">{name}</h2>
            <p className="font-body text-on-surface-variant/70 text-sm tracking-wide">{phone}</p>
            
            <button 
                onClick={onEdit}
                className="mt-8 px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-headline font-bold text-sm tracking-tight transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/10"
            >
                Редактировать
            </button>
        </section>
    );
}
