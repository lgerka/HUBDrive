/**
 * Перестановка элемента в списке — используется при смене порядка фотографий.
 *
 * Вынесено из компонента отдельно, чтобы поведение можно было проверить
 * без запуска интерфейса: порядок фото определяет обложку автомобиля,
 * ошибиться здесь дороже, чем кажется.
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (from === to) return items;
    if (from < 0 || from >= items.length) return items;
    if (to < 0 || to >= items.length) return items;

    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}
