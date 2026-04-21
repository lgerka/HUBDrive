"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Search, Bell, Image as ImageIcon, Video, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ContentStatus } from "@prisma/client";

interface AdminNews {
  id: string;
  title: string;
  date: string;
  status: ContentStatus;
  body?: string;
  videoUrl?: string | null;
  media?: any;
}

export default function AdminNewsPage() {
  const { initData } = useTelegram();
  const router = useRouter();
  const [news, setNews] = useState<AdminNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function handleDeleteNews(id: string) {
    if (!initData || !confirm("Удалить публикацию?")) return;
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
         method: 'DELETE',
         headers: { "x-telegram-init-data": initData }
      });
      if (res.ok) {
         setNews(news.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!initData) return;
    async function loadNews() {
      try {
        const res = await fetch("/api/admin/news", {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNews();
  }, [initData]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const publishedCount = news.filter(n => n.status === 'published').length;
  const draftCount = news.filter(n => n.status === 'draft').length;

  return (
    <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-sans font-extrabold tracking-tight text-on-surface">Медиа и Публикации</h2>
          <p className="text-muted-foreground font-sans mt-2">Новости, видеоотзывы и обзоры платформы HUBDrive.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button 
            onClick={() => router.push("/admin/news/new")}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-sans font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Добавить материал
          </button>
        </div>
      </div>


      {/* Grid Filter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Всего новостей</p>
          <p className="text-3xl font-sans font-extrabold tracking-tight">{news.length}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Опубликовано</p>
          <p className="text-3xl font-sans font-extrabold text-primary tracking-tight">{publishedCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Обзоры (С видео)</p>
          <p className="text-3xl font-sans font-extrabold tracking-tight">{news.filter(n => n.videoUrl).length}</p>
        </div>
        <div className="bg-gradient-to-br from-[#9d4300] to-[#f97316] p-6 rounded-3xl shadow-md text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Просмотры</p>
          <p className="text-3xl font-sans font-extrabold tracking-tight">48.2k</p>
        </div>
      </div>

      {/* Article Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-4 shadow-sm border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.1em] font-bold">
                <th className="px-6 py-4 rounded-l-xl">Материал</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 text-right rounded-r-xl">Действия</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {news.map((n) => {
                const isPublished = n.status === "published";
                const isVideo = !!n.videoUrl;
                return (
                  <tr key={n.id} className="group hover:bg-surface-container-low transition-colors duration-200">
                    <td className="px-6 py-5 rounded-l-2xl max-w-sm">
                      <div className="flex items-center">
                        <div className="h-14 w-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0 mr-4 relative flex items-center justify-center border border-border/50">
                          {isVideo ? (
                             <Video className="w-5 h-5 text-muted-foreground" />
                          ) : (
                             <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-sans font-bold leading-tight line-clamp-2 ${isPublished ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </h3>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {isVideo ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                             <Video className="w-4 h-4 text-primary" /> Видеоотзыв
                          </span>
                       ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                             <FileText className="w-4 h-4 text-primary" /> Заметка
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {new Date(n.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      {isPublished ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                          Опубликовано
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                          Черновик
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 rounded-r-2xl text-right">
                      <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => router.push(`/admin/news/${n.id}`)} className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteNews(n.id)} className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {news.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
                            <ImageIcon className="w-6 h-6 border-border/50" />
                        </div>
                        <h3 className="font-sans font-bold text-lg text-foreground">Нет материалов</h3>
                        <p className="font-sans text-sm mt-1">Здесь будут отображаться новости и видеоотзывы.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-border/50 mt-4">
          <p className="text-xs text-muted-foreground font-medium">Показано <span className="font-bold">{news.length}</span> из {news.length} материалов</p>
        </div>
      </div>
    </div>
  );
}
