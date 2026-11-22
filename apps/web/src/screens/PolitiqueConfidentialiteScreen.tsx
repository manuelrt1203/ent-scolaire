import { EntBrand } from "../components/EntBrand";

export function PolitiqueConfidentialiteScreen() {
  return (
    <div className="min-h-screen bg-white">
      <header className="accueil-banniere border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <EntBrand />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-midnight-ink">Politique de confidentialité — ENT Scolaire</h1>
        <p className="mb-8 text-sm text-slate-400">Dernière mise à jour : 19 juillet 2026</p>

        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Avertissement</strong> : ce document est un premier brouillon rédigé pour poser une base sérieuse
          avant tout déploiement réel auprès d'un établissement scolaire, en priorité en République du Congo. Il
          traite de données concernant des mineurs, ce qui est un sujet particulièrement sensible.{" "}
          <strong>
            Avant toute mise en production auprès d'une vraie école, faites relire ce document par un professionnel
            du droit congolais
          </strong>{" "}
          (avocat, ou service juridique de l'établissement partenaire) — le cadre légal ci-dessous s'appuie sur une
          recherche documentaire et non sur un conseil juridique local vérifié, et l'autorité de contrôle congolaise
          est encore en cours de mise en place (voir section 1bis), ce qui rend certains points d'application
          pratique incertains à ce stade.
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">1. Cadre légal applicable</h2>
            <p className="mb-3">
              La République du Congo dispose d'une loi de protection des données personnelles : la{" "}
              <strong>Loi n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel</strong>,
              entrée en vigueur le 25 novembre 2020. Elle pose des principes proches de ceux du RGPD européen :
              minimisation des données (article 5 — les données collectées doivent être adéquates, pertinentes et
              limitées à ce qui est nécessaire), et une obligation de notification des violations de données sous{" "}
              <strong>72 heures</strong> auprès de l'autorité de contrôle (article 74). La République du Congo est
              également membre de la CEMAC, dont les directives régionales sur la protection des données
              s'appliquent en complément.
            </p>
            <p className="mb-3">
              <strong>Point de vigilance</strong> : la loi prévoit la création d'une Commission Nationale de
              Protection des Données Personnelles, mais celle-ci n'était pas encore pleinement opérationnelle à la
              dernière vérification (un projet de loi pour l'officialiser a été adopté en Conseil des ministres en
              juillet 2024). Les modalités pratiques d'application (formulaires de déclaration, contacts officiels,
              jurisprudence) sont donc encore incertaines — à vérifier auprès d'un juriste local avant tout
              déploiement réel.
            </p>
            <p>
              <strong>Transfert international des données</strong> : les données de ce logiciel sont actuellement
              hébergées hors de République du Congo (voir section 7 — Irlande, Union européenne, via Supabase). Un
              transfert de données personnelles hors du pays peut être soumis à des conditions particulières selon
              la loi congolaise — point à faire vérifier explicitement par un juriste local, car ce document ne
              tranche pas cette question.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">1bis. Qui fait quoi (responsable de traitement / sous-traitant)</h2>
            <p className="mb-3">C'est le point le plus important à comprendre après le cadre légal :</p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                <strong>ENT Scolaire</strong> (l'éditeur du logiciel) est <strong>sous-traitant</strong> : il fournit
                l'outil technique, héberge les données, mais n'est pas celui qui décide pourquoi et comment les
                données des élèves, parents et professeurs sont utilisées.
              </li>
              <li>
                <strong>Chaque établissement scolaire</strong> utilisant le logiciel est{" "}
                <strong>responsable de traitement</strong> : c'est l'école qui décide de faire figurer tel élève
                dans telle classe, qui saisit les notes, qui signale une absence, etc. C'est donc l'établissement
                qui doit informer ses élèves/familles/personnels et qui répond de la conformité vis-à-vis d'eux.
              </li>
            </ul>
            <p>
              En pratique, cela veut dire que chaque établissement devrait publier sa propre notice d'information
              (qui peut reprendre le contenu ci-dessous en l'adaptant), et qu'un contrat de sous-traitance devrait
              être signé entre l'établissement et l'éditeur du logiciel avant toute utilisation réelle. Ce document
              sert de base à ces deux usages.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">2. Éditeur du logiciel</h2>
            <p>
              ENT Scolaire est actuellement un projet personnel/étudiant, sans structure juridique formelle. Contact
              : <strong>manuelrt1203@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">3. Données collectées</h2>
            <p className="mb-3">
              Le logiciel a été conçu pour ne collecter que ce qui est strictement nécessaire au suivi de la
              scolarité (principe de minimisation des données, conforme à l'article 5 de la loi congolaise).
              Concrètement :
            </p>
            <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Catégorie</th>
                    <th className="px-3 py-2">Champs</th>
                    <th className="px-3 py-2">Personnes concernées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Identité</td>
                    <td className="px-3 py-2">nom, prénom, adresse email, rôle (direction / professeur / élève / parent)</td>
                    <td className="px-3 py-2">Tous les utilisateurs du logiciel</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Scolarité</td>
                    <td className="px-3 py-2">classe, matières suivies, coefficients</td>
                    <td className="px-3 py-2">Élèves, professeurs</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Notes</td>
                    <td className="px-3 py-2">valeur de la note, matière, période, statut (brouillon/soumise/validée/publiée)</td>
                    <td className="px-3 py-2">Élèves</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Vie scolaire</td>
                    <td className="px-3 py-2">absences, retards, sanctions, motif/justificatif éventuel</td>
                    <td className="px-3 py-2">Élèves</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Cahier de textes</td>
                    <td className="px-3 py-2">contenu des séances, travail à faire</td>
                    <td className="px-3 py-2">Classes (visible par élèves/parents/profs concernés)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Ressources pédagogiques</td>
                    <td className="px-3 py-2">fichiers déposés par les professeurs</td>
                    <td className="px-3 py-2">Classes concernées</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Messagerie interne</td>
                    <td className="px-3 py-2">sujet, contenu, expéditeur, destinataires</td>
                    <td className="px-3 py-2">Utilisateurs échangeant entre eux</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-slate-900">Liens familiaux</td>
                    <td className="px-3 py-2">rattachement d'un compte parent à un ou plusieurs comptes élèves</td>
                    <td className="px-3 py-2">Parents, élèves</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong>Ce que le logiciel ne collecte pas</strong> : pas de numéro de téléphone, pas d'adresse
              postale, pas de date de naissance, pas de données de santé (au-delà d'un éventuel motif d'absence
              saisi manuellement par l'établissement), pas de données de géolocalisation, pas de cookies
              publicitaires ou de traceurs tiers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">4. Pourquoi ces données sont traitées (base légale)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Le suivi de la scolarité (notes, vie scolaire, communication école-famille) constitue la finalité
                principale du traitement, dans l'intérêt de la mission éducative de l'établissement.
              </li>
              <li>
                <strong>Aucun consentement des mineurs ou de leurs parents n'est requis</strong> pour cet usage
                pédagogique de base (c'est l'établissement qui porte la responsabilité du traitement), mais la
                transparence envers les familles reste une obligation — d'où cette notice.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">5. Durée de conservation</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Les données de l'année scolaire en cours restent accessibles pendant toute l'année.</li>
              <li>
                Au-delà, la durée de conservation recommandée est alignée sur les préconisations habituelles du
                secteur éducatif : conservation des données de scolarité pendant la durée de scolarisation dans
                l'établissement + une durée courte après la sortie de l'élève (typiquement quelques années, à fixer
                précisément par chaque établissement selon ses obligations d'archivage).
              </li>
              <li>
                Les messages internes et les événements de vie scolaire font l'objet d'une purge automatique
                au-delà d'une durée configurable par établissement (36 mois par défaut) — voir l'écran "Paramètres"
                côté direction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">6. Qui a accès aux données</h2>
            <p className="mb-3">
              L'accès est strictement cloisonné par rôle et par établissement (un professeur ou un parent d'un
              établissement A ne peut techniquement pas accéder aux données d'un établissement B, même en cas de
              bug applicatif — cette séparation est appliquée au niveau de la base de données elle-même, pas
              seulement dans l'interface).
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Direction</strong> : accès à l'ensemble des données de son établissement.</li>
              <li><strong>Professeur</strong> : accès aux données des classes et matières qui lui sont affectées.</li>
              <li><strong>Élève</strong> : accès à ses propres notes (une fois publiées), son propre cahier de textes, sa messagerie.</li>
              <li><strong>Parent</strong> : accès aux mêmes informations que son enfant, limité aux enfants qui lui sont explicitement rattachés.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">7. Hébergement et sécurité</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Les données sont hébergées chez <strong>Supabase</strong>, dans la région{" "}
                <strong>eu-west-1 (Irlande, Union européenne)</strong> — voir la section 1 sur le transfert
                international des données, à faire vérifier par un juriste local.
              </li>
              <li>
                L'accès aux données est protégé par un système d'authentification (mot de passe) et par des règles
                de sécurité appliquées au niveau de la base de données (Row Level Security), qui empêchent
                techniquement un utilisateur de lire ou modifier des données auxquelles il n'a pas droit,
                indépendamment de l'application utilisée pour s'y connecter.
              </li>
              <li>
                En cas de violation de données, l'éditeur s'engage à en informer les établissements concernés dans
                les meilleurs délais, pour leur permettre de respecter leur propre obligation de notification sous
                72 heures (article 74 de la loi congolaise) une fois l'autorité de contrôle pleinement
                opérationnelle.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">8. Droits des personnes concernées</h2>
            <p className="mb-3">
              Toute personne dont les données sont traitées (ou son représentant légal pour un mineur) dispose de
              droits similaires à ceux prévus par les cadres de protection des données modernes :
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li><strong>Droit d'accès</strong> : obtenir une copie des données la concernant.</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes.</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression des données (dans la limite des obligations légales de conservation d'un établissement scolaire).</li>
              <li><strong>Droit d'opposition et de limitation</strong>.</li>
            </ul>
            <p>
              Ces demandes doivent être adressées en priorité à l'établissement scolaire (responsable de
              traitement), qui pourra solliciter l'éditeur du logiciel si une action technique est nécessaire.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">9. Contact</h2>
            <p>
              Pour toute question sur ce document ou sur le traitement des données par le logiciel :{" "}
              <strong>manuelrt1203@gmail.com</strong>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
