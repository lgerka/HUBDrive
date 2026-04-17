"use client";

import { useRouter } from 'next/navigation';
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { EditProfileForm } from '@/components/hubdrive/profile/edit-profile-form';
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useTelegram();
    const { toast } = useToast();

    const userName = user 
        ? `${user.first_name} ${user.last_name || ""}`.trim() 
        : "Александр Петров"; // Placeholder like design if no user
        
    const userPhone = user?.username 
        ? `@${user.username}` 
        : "+7 (999) 123-45-67"; 

    const handleSubmit = (data: any) => {
        console.log("Profile updated:", data);
        toast({
            title: "Успешно",
            description: "Ваш профиль обновлен",
        });
        router.back();
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background max-w-md mx-auto overflow-x-hidden">
            {/* Top Navigation */}
            <div className="flex items-center bg-background p-4 pb-2 justify-between border-b border-border sticky top-0 z-10 backdrop-blur-md bg-background/95">
                <button 
                    onClick={() => router.back()}
                    className="text-foreground flex size-10 shrink-0 items-center justify-center hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight flex-1 text-center">
                    Редактировать профиль
                </h2>
                <div className="flex w-10 items-center justify-end">
                    <button 
                        onClick={() => router.back()}
                        className="text-primary text-base font-bold leading-normal tracking-tight hover:opacity-80 transition-opacity"
                    >
                        Готово
                    </button>
                </div>
            </div>

            {/* Profile Form Content */}
            <div className="flex-1 w-full">
                <EditProfileForm 
                    initialData={{
                        name: userName,
                        phone: userPhone,
                        city: "Алматы", // Default city for demo
                        photoUrl: user?.photo_url
                    }}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
