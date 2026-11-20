import { Link } from "react-router-dom";
import { IconGraduationCap, IconBookOpen, IconClipboard, IconShield, IconMegaphone, IconMail, IconArrowRight, IconHome } from "../components/icons";

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
    description: "Suivi des absences, des retards et des sanctions, avec information des familles.",
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

const LIEN = "inline-flex w-fit items-center gap-2 rounded-sm text-sm font-semibold text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700";

export function LandingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 text-midnight-ink">
      <div className="bg-midnight-ink text-white">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3 font-semibold">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-300 text-midnight-ink">
                <IconGraduationCap className="size-6" aria-hidden="true" />
              </span>
              ENT Scolaire
            </div>
            <Link to="/login" className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
              Se connecter
            </Link>
          </div>
        </header>

        <main>
          <section className="bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.22),transparent_60%)]">
            <div className="mx-auto grid max-w-6xl gap-9 px-5 py-12 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-20">
              <div>
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  L’espace numérique de votre établissement
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                  Retrouvez les notes, le cahier de textes et les informations de l’école dans un espace commun aux équipes scolaires, aux élèves et aux familles.
                </p>
                <a href="#acces" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-teal-300 px-5 py-3 text-sm font-semibold text-midnight-ink hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
                  Accéder à l’ENT <span aria-hidden="true">↓</span>
                </a>
              </div>
              <figure className="m-0 rounded-3xl border border-white/15 bg-white/5 p-3 sm:p-5">
                <figcaption className="mb-3 px-2 text-sm font-medium text-teal-100">Aperçu des rubriques</figcaption>
                <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-midnight-ink sm:gap-3 sm:p-4">
                  {FONCTIONNALITES.map(({ icon: Icon, titre }) => (
                    <li key={titre} className="rounded-xl bg-slate-100 p-3 text-xs font-semibold sm:text-sm">
                      <Icon className="mb-2 size-5 text-teal-700" aria-hidden="true" />
                      {titre}
                    </li>
                  ))}
                </ul>
              </figure>
            </div>
          </section>

          <div className="bg-slate-50 text-midnight-ink">
            <section id="acces" aria-labelledby="titre-acces" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
              <h2 id="titre-acces" className="text-2xl font-semibold tracking-tight sm:text-3xl">Accéder à votre établissement</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <IconHome className="size-6 text-teal-700" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Se connecter</h3>
                  <p className="text-sm leading-relaxed text-slate-600">Vous avez déjà activé votre compte ENT.</p>
                  <Link to="/login" className={LIEN + " mt-auto"}>
                    Ouvrir ma session <IconArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
                <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <IconMail className="size-6 text-teal-700" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Rejoindre mon établissement</h3>
                  <p className="text-sm leading-relaxed text-slate-600">Votre établissement vous a envoyé une invitation ou a déjà créé votre compte.</p>
                  <div className="mt-auto flex flex-col gap-3">
                    <Link to="/invitation" className={LIEN}>
                      Utiliser mon code d’invitation <IconArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                    <Link to="/activation" className={LIEN}>
                      Activer mon compte <IconArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
                <article className="flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6">
                  <IconGraduationCap className="size-6 text-teal-700" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">Créer l’espace de mon établissement</h3>
                  <p className="text-sm leading-relaxed text-slate-700">Pour la direction ou la personne mandatée pour configurer l’ENT de l’école.</p>
                  <Link to="/inscription" className={LIEN + " mt-auto"}>
                    Inscrire mon établissement <IconArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </Link>
                </article>
              </div>
            </section>

            <section aria-labelledby="titre-fonctionnalites" className="border-t border-slate-200 bg-white">
              <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
                <h2 id="titre-fonctionnalites" className="text-2xl font-semibold tracking-tight sm:text-3xl">Les fonctionnalités de l’ENT</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {FONCTIONNALITES.map(({ icon: Icon, titre, description }) => (
                    <article key={titre} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-800">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">{titre}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-6 text-sm text-slate-600 sm:px-8">
          <span className="font-semibold text-midnight-ink">ENT Scolaire</span>
          <Link to="/politique-confidentialite" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
