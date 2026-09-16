import { Link } from "react-router-dom";
import { IconGraduationCap, IconBookOpen, IconClipboard, IconShield, IconMegaphone, IconMail } from "../components/icons";

const FONCTIONNALITES = [
  {
    icon: IconClipboard,
    titre: "Notes & bulletins",
    description: "Saisie par les professeurs, validation par la direction, bulletins PDF générés automatiquement.",
  },
  {
    icon: IconBookOpen,
    titre: "Cahier de textes & ressources",
    description: "Contenu des séances et documents pédagogiques accessibles à tout moment par les élèves et les parents.",
  },
  {
    icon: IconShield,
    titre: "Vie scolaire",
    description: "Absences, retards et sanctions suivis et communiqués aux familles en temps réel.",
  },
  {
    icon: IconMail,
    titre: "Messagerie interne",
    description: "Direction, professeurs, élèves et parents échangent directement dans l'établissement.",
  },
  {
    icon: IconMegaphone,
    titre: "Actualités & calendrier",
    description: "Informations et événements de l'établissement centralisés, ciblés par rôle.",
  },
  {
    icon: IconGraduationCap,
    titre: "Emploi du temps",
    description: "Consultable par classe, à jour pour les professeurs comme pour les élèves.",
  },
];

export function LandingScreen() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-ink text-white">
              <IconGraduationCap className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold tracking-tight text-midnight-ink">ENT Scolaire</span>
          </div>
          <Link
            to="/login"
            className="rounded-md bg-indigo-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-ink/90"
          >
            Se connecter
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-midnight-ink sm:text-4xl">
          L'espace numérique de travail de votre établissement
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          Notes, vie scolaire, emploi du temps, messagerie et ressources pédagogiques réunis au même endroit pour la
          direction, les professeurs, les élèves et les parents.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="w-full rounded-md bg-indigo-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-ink/90 sm:w-auto"
          >
            Se connecter
          </Link>
          <Link
            to="/inscription"
            className="w-full rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Inscrire mon établissement
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
            Un espace, quatre rôles, tout ce qu'il faut
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONNALITES.map(({ icon: Icon, titre, description }) => (
              <div key={titre} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-periwinkle-wash text-indigo-ink">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{titre}</h3>
                <p className="text-sm text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400 sm:px-6">
          ENT Scolaire — Espace numérique de travail pour établissements scolaires.
        </div>
      </footer>
    </div>
  );
}
