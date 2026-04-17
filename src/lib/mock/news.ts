export interface NewsItem {
    id: string;
    title: string;
    date: string;
    excerpt: string;
    imageUrl: string;
    content: string; // HTML or Markdown
}

export const mockNews: NewsItem[] = [
    {
        id: 'n1',
        title: 'Как Zeekr 001 справляется с зимой в Астане',
        date: '2024-01-15',
        excerpt: 'Мы протестировали популярный электромобиль в -30 градусов. Результаты вас удивят.',
        imageUrl: 'https://images.unsplash.com/photo-1698308385316-5c5e87aexd?q=80&w=2940&auto=format&fit=crop', // placeholder
        content: '<p>Длинный текст про испытания...</p>'
    },
    {
        id: 'n2',
        title: 'Снижение цен на Lixiang L7',
        date: '2024-02-10',
        excerpt: 'В честь китайского нового года цены снижены на 5%.',
        imageUrl: 'https://images.unsplash.com/photo-1678864708709-a7977465355a?q=80&w=2940&auto=format&fit=crop', // placeholder
        content: '<p>Подробности акции...</p>'
    }
];
