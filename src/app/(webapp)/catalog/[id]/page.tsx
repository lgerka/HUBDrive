'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle } from 'lucide-react';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export default function VehicleDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const { user, webApp } = useTelegram();
    const id = params.id;

    const handleContact = () => {
        toast({
            title: "Заявка отправлена",
            description: `Менеджер получил вашу заявку на авто #${id}. ${user?.first_name ? `Спасибо, ${user.first_name}!` : ''}`,
            duration: 3000,
        });
    };

    const handleFavorite = () => {
        toast({
            title: "В избранное",
            description: "Автомобиль добавлен в ваш список избранных.",
            duration: 2000,
        });
    };

    return (
        <div className="p-4 space-y-4">
            <Card className="w-full">
                <div className="aspect-video bg-muted relative flex items-center justify-center text-muted-foreground">
                    Car Image Placeholder
                </div>
                <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                        <span>Hyundai Sonata, 2024</span>
                        <span className="text-primary text-xl">12 500 000 ₸</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Пробег</span>
                            <span>15 000 км</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Двигатель</span>
                            <span>2.5 л / Бензин</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Коробка</span>
                            <span>Автомат</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button className="flex-1 bg-[#2AABEE] hover:bg-[#2AABEE]/90" onClick={handleContact}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Связаться
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleFavorite}>
                        <Heart className="w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>

            <div className="text-xs text-muted-foreground text-center">
                User ID: {user?.id || 'Unknown'} <br />
                Platform: {webApp?.platform || 'Web'}
            </div>
        </div>
    );
}
