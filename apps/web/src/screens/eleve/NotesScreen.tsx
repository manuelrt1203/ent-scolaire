import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAuth,
  usePeriodes,
  useBulletin,
  useMoyenneGenerale,
  formatMoyenne,
  getDetailsBulletin,
  getDecisionConseilPubliee,
  getProfile,
  getEtablissement,
  buildBulletinHtml,
} from "@ent/shared";
import { useViewedEleveId } from "../../lib/ViewedEleveContext";
import { ChildSwitcher } from "../../components/ChildSwitcher";
import { Button } from "../../components/ui/Button";
import { imprimerBulletin } from "../../components/imprimerBulletin";
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

  const [telechargementEnCours, setTelechargementEnCours] = useState(false);
  const [erreurBulletin, setErreurBulletin] = useState("");

  async function handleTelechargerBulletin() {
    if (!eleveId || !periodeId || !profile || !bulletinQuery.data) return;
    setErreurBulletin("");
    setTelechargementEnCours(true);
    try {
      const lignes = bulletinQuery.data;
      await imprimerBulletin(async () => {
        const [eleveProfile, etablissement, details, decisionConseil] = await Promise.all([
          eleveId === profile.id ? Promise.resolve(profile) : getProfile(client, eleveId),
          getEtablissement(client, profile.etablissement_id),
          getDetailsBulletin(client, eleveId, periodeId),
          getDecisionConseilPubliee(client, eleveId, periodeId),
        ]);
        return buildBulletinHtml({
          etablissementNom: etablissement?.nom ?? "",
          eleveNom: eleveProfile?.nom ?? "",
          elevePrenom: eleveProfile?.prenom ?? "",
          details,
          decisionConseil,
          periodeNom: periodesQuery.data?.find((p) => p.id === periodeId)?.nom ?? "",
          lignes,
        });
      });
    } catch (error) {
      setErreurBulletin(error instanceof Error ? error.message : "Impossible de générer le bulletin. Réessayez.");
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

      {erreurBulletin && <p role="alert" className="mb-4 text-sm text-red-700">{erreurBulletin}</p>}

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
