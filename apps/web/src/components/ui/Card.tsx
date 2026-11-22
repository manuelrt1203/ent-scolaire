import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  tinted = false,
}: {
  children: ReactNode;
  className?: string;
  /** Fond légèrement teinté (bg-slate-50) au lieu du blanc — ex. bulle de
   * message "envoyé par moi". Un prop plutôt qu'une classe `bg-*` passée en
   * className : Tailwind ne garantit pas qu'une classe de fond ajoutée après
   * coup dans la chaîne l'emporte sur le bg-white déjà présent. */
  tinted?: boolean;
}) {
  return <div className={`rounded-2xl border border-slate-200 shadow-sm ${tinted ? "bg-ent-tint" : "bg-white"} ${className}`}>{children}</div>;
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-midnight-ink sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
