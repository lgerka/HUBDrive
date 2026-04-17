import { webhookCallback } from "grammy";
import { bot } from "@/lib/server/telegram/bot";

// This links the bot to Next.js edge/serverless function format
export const POST = webhookCallback(bot, "std/http");

export async function GET() {
    return new Response("Webhook is active.", { status: 200 });
}
