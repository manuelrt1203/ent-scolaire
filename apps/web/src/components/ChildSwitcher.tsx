import { useParentChild } from "../lib/ParentChildContext";

export function ChildSwitcher() {
  const { enfants, selectedId, setSelectedId } = useParentChild();

  if (enfants.length <= 1) return null;

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto">
      {enfants.map((e) => (
        <button
          key={e.id}
          onClick={() => setSelectedId(e.id)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
            e.id === selectedId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {e.prenom} {e.nom}
        </button>
      ))}
    </div>
  );
}
