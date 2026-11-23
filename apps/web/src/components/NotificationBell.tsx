import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  useAuth,
  useNotifications,
  useNombreNotificationsNonLues,
  useMarquerNotificationCommeLue,
  useMarquerToutesNotificationsCommeLues,
} from "@ent/shared";
import { IconBell } from "./icons";

function formatRelatif(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j === 1) return "hier";
  if (j < 7) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function NotificationBell() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const nonLuesQuery = useNombreNotificationsNonLues(client);
  const notificationsQuery = useNotifications(client);
  const marquerLue = useMarquerNotificationCommeLue(client);
  const marquerToutesLues = useMarquerToutesNotificationsCommeLues(client);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    }
    if (ouvert) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ouvert]);

  function handleClickNotification(n: { id: string; lu: boolean; lien: string | null }) {
    if (!n.lu) marquerLue.mutate(n.id);
    setOuvert(false);
    if (!n.lien) return;
    if (n.lien.split("?")[0].endsWith("/emploi-du-temps")) {
      void queryClient.invalidateQueries({ queryKey: ["exceptions-creneaux"] });
    }
    navigate(n.lien);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <IconBell className="h-5 w-5" />
        {Boolean(nonLuesQuery.data) && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {nonLuesQuery.data}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {Boolean(nonLuesQuery.data) && (
              <button onClick={() => marquerToutesLues.mutate()} className="text-xs text-ent-accent hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationsQuery.data?.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.lu ? "" : "bg-ent-tint/40"}`}
              >
                <div className="flex w-full items-center gap-2">
                  {!n.lu && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ent-accent" />}
                  <span className="flex-1 truncate text-sm font-medium text-slate-900">{n.titre}</span>
                  <span className="shrink-0 text-xs text-slate-400">{formatRelatif(n.created_at)}</span>
                </div>
                {n.contenu && <p className={`pl-3.5 text-xs text-slate-600 ${n.type === "emploi_du_temps" ? "whitespace-pre-line" : "line-clamp-2"}`}>{n.contenu}</p>}
              </button>
            ))}
            {notificationsQuery.data?.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Aucune notification pour le moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
