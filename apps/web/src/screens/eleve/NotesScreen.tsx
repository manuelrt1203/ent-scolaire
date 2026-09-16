import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useAuth,
  usePeriodes,
  useBulletin,
  useMoyenneGenerale,
  formatMoyenne,
  getClasseEleve,
  getProfile,
  getEtablissement,
  buildBulletinHtml,
} from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { Button } from "../../components/ui/Button";
import { Card, EmptyState, PageHeader } from "../../components/ui/Card";

export function NotesScreen() {
  const { client, profile } = useAuth();
  const eleveId = useViewedEleveId();

  const periodesQuery = usePeriodes(client);
  const [periodeId, setPeriodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!periodeId && periodesQuery.data && periodesQuery.data.length > 0) {
      const active = periodesQuery.data[periodesQuery.data.length - 1];
      setPeriodeId(active.id);
    }
  }, [periodesQuery.data, periodeId]);

  const bulletinQuery = useBulletin(client, eleveId, periodeId);
  const moyenneGeneraleQuery = useMoyenneGenerale(client, eleveId, periodeId);

  const classeQuery = useQuery({
    queryKey: ["classe-eleve", eleveId],
    queryFn: () => getClasseEleve(client, eleveId as string),
    enabled: Boolean(eleveId),
  });

  const [telechargementEnCours, setTelechargementEnCours] = useState(false);

  async function handleTelechargerBulletin() {
    if (!eleveId || !periodeId || !profile || !bulletinQuery.data) return;
    setTelechargementEnCours(true);
    try {
      const [eleveProfile, etablissement] = await Promise.all([
        eleveId === profile.id ? Promise.resolve(profile) : getProfile(client, eleveId),
        getEtablissement(client, profile.etablissement_id),
      ]);
      const periode = periodesQuery.data?.find((p) => p.id === periodeId);
      const html = buildBulletinHtml({
        etablissementNom: etablissement?.nom ?? "",
        eleveNom: eleveProfile?.nom ?? "",
        elevePrenom: eleveProfile?.prenom ?? "",
        classeNom: classeQuery.data?.classes?.nom ?? null,
        periodeNom: periode?.nom ?? "",
        lignes: bulletinQuery.data,
        moyenneGenerale: moyenneGeneraleQuery.data ?? null,
      });
      // Pas d'équivalent web à expo-print : on ouvre le bulletin dans un
      // nouvel onglet et on déclenche directement l'impression, où
      // l'utilisateur choisit "Enregistrer au format PDF" comme destination.
      const fenetre = window.open("", "_blank");
      if (fenetre) {
        fenetre.document.write(html);
        fenetre.document.close();
        fenetre.focus();
        fenetre.print();
      }
    } finally {
      setTelechargementEnCours(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {profile?.role === "parent" && <ChildSwitcher />}
      <PageHeader title="Notes" description="Moyennes et relevés par matière." />

      {periodesQuery.data && periodesQuery.data.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {periodesQuery.data.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodeId(p.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                p.id === periodeId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.nom}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 rounded-xl bg-slate-900 p-5">
        <p className="text-sm text-slate-300">Moyenne générale</p>
        <p className="text-3xl font-semibold tabular-nums text-white">{formatMoyenne(moyenneGeneraleQuery.data ?? null)}</p>
      </div>

      {bulletinQuery.data && bulletinQuery.data.length > 0 && (
        <Button variant="secondary" onClick={handleTelechargerBulletin} disabled={telechargementEnCours} className="mb-6 w-full">
          {telechargementEnCours ? "Génération…" : "Télécharger le bulletin (PDF)"}
        </Button>
      )}

      <div className="space-y-2">
        {bulletinQuery.data?.map((ligne) => (
          <Link
            key={ligne.matiere_classe_id}
            to={`matiere/${ligne.matiere_classe_id}?periodeId=${periodeId}`}
            className="block"
          >
            <Card className="flex items-center justify-between p-4 transition-colors hover:border-indigo-ink/40">
              <div>
                <p className="text-sm font-medium text-slate-900">{ligne.matiere}</p>
                <p className="text-xs text-slate-400">Coefficient {ligne.coefficient}</p>
              </div>
              <span className="text-base font-semibold tabular-nums text-slate-900">{formatMoyenne(ligne.moyenne)}</span>
            </Card>
          </Link>
        ))}
        {bulletinQuery.data?.length === 0 && <EmptyState message="Aucune note publiée pour cette période." />}
      </div>
    </div>
  );
}
