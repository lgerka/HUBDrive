import { webhookCallback } from "grammy";
import { bot } from "@/lib/server/telegram/bot";
import { allowedWebhookSecrets } from "@/lib/server/telegram/webhookSecret";
import { NextResponse } from "next/server";

// MED-03: Проверка secret token из заголовка X-Telegram-Bot-Api-Secret-Token
// Устанавливается при регистрации webhook: setWebhook(url, { secret_token: ... })
export async function POST(request: Request) {
    const secrets = await allowedWebhookSecrets();

    if (secrets.length > 0) {
        const receivedSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (!receivedSecret || !secrets.includes(receivedSecret)) {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    // Передаём запрос в grammy handler
    return webhookCallback(bot, "std/http")(request);
}

export async function GET() {
    return new Response("Webhook is active.", { status: 200 });
}
