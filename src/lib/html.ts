/** Telegram понимает ограниченный HTML: всё, что пришло от людей, экранируем. */
export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
