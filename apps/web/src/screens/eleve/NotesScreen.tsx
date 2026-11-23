import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useAuth,
  usePeriodes,
  useBulletin,
  moyenneBulletin,
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
  const [recherche, setRecherche] = useSearchParams();
  const periodes = periodesQuery.data ?? [];
  const periode = periodes.find(({ id }) => id === recherche.get("periode")) ?? periodes.at(-1);
  const periodeId = periode?.id ?? null;

  const bulletinQuery = useBulletin(client, eleveId, periodeId);
  const lignes = bulletinQuery.data ?? [];
  const aDesNotesPubliees = bulletinQuery.isSuccess && lignes.length > 0;
  const moyennePubliee = moyenneBulletin(lignes);

  const [telechargementEnCours, setTelechargementEnCours] = useState(false);
  const [erreurBulletin, setErreurBulletin] = useState("");

  async function handleTelechargerBulletin() {
    if (!eleveId || !periodeId || !profile || !aDesNotesPubliees || moyennePubliee === null) return;
    setErreurBulletin("");
    setTelechargementEnCours(true);
    try {
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
          periodeNom: periode?.nom ?? "",
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

      {periodes.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto">
          {periodes.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === periodeId}
              onClick={() => setRecherche((actuels) => {
                const suivants = new URLSearchParams(actuels);
                suivants.set("periode", p.id);
                return suivants;
              })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                p.id === periodeId ? "bg-midnight-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.nom}
            </button>
          ))}
        </div>
      )}

      {periodesQuery.isError || bulletinQuery.isError ? (
        <p role="alert" className="mb-4 text-sm text-red-700">Impossible de charger les notes.</p>
      ) : periodesQuery.isPending || (eleveId && periodeId && bulletinQuery.isPending) ? (
        <p role="status" className="mb-4 text-sm text-slate-600">Chargement des notes…</p>
      ) : periodes.length === 0 ? (
        <EmptyState message="Aucune période scolaire disponible." />
      ) : bulletinQuery.isSuccess && !aDesNotesPubliees ? (
        <EmptyState message="Aucune note publiée pour cette période." />
      ) : null}

      {aDesNotesPubliees && (
        <>
          <div className="accueil-banniere mb-4 rounded-xl p-5">
            <p className="text-sm text-slate-200">Moyenne des matières publiées</p>
            <p className="text-3xl font-semibold tabular-nums text-white">{formatMoyenne(moyennePubliee)}</p>
          </div>
          {moyennePubliee !== null && (
            <Button variant="secondary" onClick={handleTelechargerBulletin} disabled={telechargementEnCours} className="mb-6 w-full">
              {telechargementEnCours ? "Génération…" : "Télécharger le bulletin (PDF)"}
            </Button>
          )}
        </>
      )}

      {erreurBulletin && <p role="alert" className="mb-4 text-sm text-red-700">{erreurBulletin}</p>}

      <div className="space-y-2">
        {aDesNotesPubliees && lignes.map((ligne) => (
          <Link
            key={ligne.matiere_classe_id}
            to={`../matiere/${ligne.matiere_classe_id}?periodeId=${periodeId}`}
            className="block"
          >
            <Card className="flex items-center justify-between p-4 transition-colors hover:border-ent-accent/40">
              <div>
                <p className="text-sm font-medium text-slate-900">{ligne.matiere}</p>
                <p className="text-xs text-slate-400">Coefficient {ligne.coefficient}</p>
              </div>
              <span className="text-base font-semibold tabular-nums text-slate-900">{formatMoyenne(ligne.moyenne)}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
