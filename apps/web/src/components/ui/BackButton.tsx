import { IconArrowLeft } from "../icons";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Étape précédente"
      className="mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <IconArrowLeft className="h-4 w-4" />
    </button>
  );
}
