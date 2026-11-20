import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerEtablissement, useAuth, PAYS_CALENDRIER, type PaysCalendrier } from "@ent/shared";
import { BackButton } from "../../components/ui/BackButton";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { IconGraduationCap } from "../../components/icons";

const TOTAL_STEPS = 6;

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-ink text-white">
          <IconGraduationCap className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold tracking-tight text-midnight-ink">ENT Scolaire</span>
      </Link>
      {children}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6 flex gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-indigo-ink" : "bg-slate-100"}`} />
      ))}
    </div>
  );
}

export function InscriptionEtablissementScreen() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pays, setPays] = useState<PaysCalendrier | "">("");
  const [etablissementNom, setEtablissementNom] = useState("");
  const [etablissementAdresse, setEtablissementAdresse] = useState("");
  const [directionPrenom, setDirectionPrenom] = useState("");
  const [directionNom, setDirectionNom] = useState("");
  const [directionEmail, setDirectionEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<{ email: string } | null>(null);

  function next(e: FormEvent) {
    e.preventDefault();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pays || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await registerEtablissement(client, {
        etablissementNom,
        pays,
        etablissementAdresse: etablissementAdresse || undefined,
        directionNom,
        directionPrenom,
        directionEmail,
      });
      setSucces({ email: result.directionEmail });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  if (succes) {
    return (
      <Shell>
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">Établissement créé</h1>
          <p className="mb-4 text-sm text-slate-600">
            Votre compte direction a été créé pour <span className="font-medium">{succes.email}</span>. Activez-le
            maintenant via « Première connexion » : un code vous sera envoyé par email.
          </p>
          <Button type="button" onClick={() => navigate("/activation")} className="w-full">
            Activer mon compte
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <ProgressBar step={step} />
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-400">Étape {step + 1} sur {TOTAL_STEPS}</p>

        {step === 0 && (
          <form onSubmit={next}>
            <h1 className="mb-2 text-lg font-semibold text-slate-900">Dans quel pays se trouve votre établissement ?</h1>
            <p className="mb-4 text-sm text-slate-600">Ce choix adapte le calendrier et les réglages scolaires disponibles.</p>
            <div className="mb-6">
              <Field label="Pays de l’établissement">
                <Select value={pays} onChange={(e) => setPays(e.target.value as PaysCalendrier | "")} required autoFocus>
                  <option value="">Choisir un pays</option>
                  {Object.entries(PAYS_CALENDRIER).map(([code, nom]) => (
                    <option key={code} value={code}>{nom}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit" disabled={!pays} className="w-full">Continuer</Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={next}>
            <BackButton onClick={back} />
            <h1 className="mb-6 text-lg font-semibold text-slate-900">Comment s'appelle votre établissement ?</h1>
            <div className="mb-6">
              <Field label="Nom de l'établissement">
                <Input value={etablissementNom} onChange={(e) => setEtablissementNom(e.target.value)} required autoFocus />
              </Field>
            </div>
            <Button type="submit" className="w-full">Continuer</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={next}>
            <BackButton onClick={back} />
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Quelle est son adresse ?</h1>
            <p className="mb-6 text-xs text-slate-500">Optionnel — vous pouvez passer cette étape.</p>
            <div className="mb-6">
              <Field label="Adresse">
                <Input value={etablissementAdresse} onChange={(e) => setEtablissementAdresse(e.target.value)} autoFocus />
              </Field>
            </div>
            <Button type="submit" className="w-full">{etablissementAdresse ? "Continuer" : "Passer cette étape"}</Button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={next}>
            <BackButton onClick={back} />
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Quel est votre prénom ?</h1>
            <p className="mb-6 text-xs text-slate-500">Vous serez le premier compte direction de l'établissement.</p>
            <div className="mb-6">
              <Field label="Prénom">
                <Input value={directionPrenom} onChange={(e) => setDirectionPrenom(e.target.value)} required autoFocus />
              </Field>
            </div>
            <Button type="submit" className="w-full">Continuer</Button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={next}>
            <BackButton onClick={back} />
            <h1 className="mb-6 text-lg font-semibold text-slate-900">Et votre nom ?</h1>
            <div className="mb-6">
              <Field label="Nom">
                <Input value={directionNom} onChange={(e) => setDirectionNom(e.target.value)} required autoFocus />
              </Field>
            </div>
            <Button type="submit" className="w-full">Continuer</Button>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={handleSubmit}>
            <BackButton onClick={back} />
            <h1 className="mb-1 text-lg font-semibold text-slate-900">Quelle adresse email pour votre compte ?</h1>
            <p className="mb-6 text-xs text-slate-500">Elle servira à activer votre compte direction.</p>
            <div className="mb-6">
              <Field label="Email">
                <Input type="email" value={directionEmail} onChange={(e) => setDirectionEmail(e.target.value)} required autoFocus />
              </Field>
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Création…" : "Créer mon établissement"}
            </Button>
          </form>
        )}

        <button type="button" onClick={() => navigate("/login")} className="mt-5 w-full text-center text-xs text-slate-500 hover:underline">
          Retour à la connexion
        </button>
      </div>
    </Shell>
  );
}
