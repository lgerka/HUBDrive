"use client";

import Image from "next/image";
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Loader2,
  Trash2
} from "lucide-react";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  telegramId: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  lastActiveAt: string | null;
}

export default function AdminUsersPage() {
  const { initData } = useTelegram();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [initData]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Вы уверены, что хотите изменить роль на ${newRole}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await loadUsers();
      } else {
        alert("Ошибка при обновлении роли");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const uname = (u.username || '').toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || uname.includes(q);
  });

  const adminsCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
      {/* Dashboard Greeting & Stats */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-3xl relative overflow-hidden shadow-sm border border-border/50">
          <div className="relative z-10">
            <h3 className="font-sans text-2xl font-extrabold mb-2">Добро пожаловать в Curator Dashboard</h3>
            <p className="text-muted-foreground max-w-md font-sans font-medium leading-relaxed">
              Управляйте правами доступа и просматривайте активность пользователей в режиме реального времени.
            </p>
            <div className="flex gap-8 mt-8">
              <div>
                <span className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Всего пользователей</span>
                <span className="text-3xl font-sans font-extrabold">{users.length}</span>
              </div>
              <div className="w-px h-10 bg-border/60 self-end"></div>
              <div>
                <span className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Менеджеры</span>
                <span className="text-3xl font-sans font-extrabold">{adminsCount}</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent flex items-center justify-center">
            <Users className="w-32 h-32 text-primary/10 select-none" />
          </div>
        </div>

        {/* Bento Card: Quick Filters */}
        <div className="col-span-12 lg:col-span-4 bg-muted/30 p-6 rounded-3xl border border-border/50">
          <h4 className="font-sans font-bold text-sm mb-4">Статистика</h4>
          <div className="flex flex-col gap-4">
             <div className="bg-background px-4 py-3 rounded-2xl shadow-sm border border-border/50 flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground">Клиенты</span>
                <span className="font-bold text-sm">{users.length - adminsCount}</span>
             </div>
             <div className="bg-background px-4 py-3 rounded-2xl shadow-sm border border-border/50 flex justify-between items-center text-primary">
                <span className="text-xs font-bold">Администраторы</span>
                <span className="font-bold text-sm">{adminsCount}</span>
             </div>
          </div>
        </div>
      </div>

      {/* User Management Table Section */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-4 shadow-sm border border-border/50">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 mb-2 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                className="w-full bg-muted/50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-primary/50 transition-all outline-none" 
                placeholder="Поиск по имени или username..." 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Сортировка:</span>
             <span className="bg-transparent border-none text-xs font-bold text-foreground">По новым</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.1em] font-bold">
                  <th className="px-6 py-4">Пользователь</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Присоединился</th>
                  <th className="px-6 py-4">Иконка</th>
                  <th className="px-6 py-4 text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredUsers.map(user => {
                  const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || 'U';
                  const isManager = user.role === 'admin';
                  return (
                    <tr key={user.id} className="group hover:bg-muted/30 transition-colors duration-200">
                      <td className="px-6 py-5 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`min-w-10 min-h-10 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isManager ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {initials}
                          </div>
                          <span className="font-semibold text-foreground line-clamp-1">{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground">{user.username ? `@${user.username}` : '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isManager ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                          {isManager ? 'Менеджер' : 'Клиент'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Акт.
                        </div>
                      </td>
                      <td className="px-6 py-5 rounded-r-2xl text-right">
                         <button 
                           onClick={() => toggleRole(user.id, user.role)}
                           className="text-xs font-bold text-primary hover:underline"
                         >
                           {isManager ? 'Сделать клиентом' : 'Сделать администратором'}
                         </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Никого не найдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination mock */}
        <div className="flex justify-between items-center mt-6 p-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium tracking-tight">Показано {filteredUsers.length} из {users.length} пользователей</span>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
          <div className="p-3 bg-background rounded-xl shadow-sm text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Безопасность</span>
            <span className="text-sm font-bold text-foreground">API Sync On</span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
          <div className="p-3 bg-background rounded-xl shadow-sm text-blue-500">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Синхронизация</span>
            <span className="text-sm font-bold text-foreground">Prisma DB</span>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex justify-between items-center">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
               <HardDrive className="w-3.5 h-3.5" /> Telegram Webhooks
             </span>
             <span className="text-sm font-bold mt-1">Ожидание событий</span>
          </div>
        </div>
      </div>
    </div>
  );
}
