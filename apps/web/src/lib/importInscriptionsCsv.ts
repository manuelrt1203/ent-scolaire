import Papa from "papaparse";

export const MAX_LIGNES_IMPORT = 500;
const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function lireListeInscriptions(csv: string) {
  const resultat = Papa.parse<string[]>(csv.replace(/^\ufeff/, ""), {
    delimitersToGuess: [",", ";", "\t"],
    skipEmptyLines: "greedy",
    preview: MAX_LIGNES_IMPORT + 2,
  });
  if (resultat.errors.some(({ code }) => code !== "UndetectableDelimiter")) {
    throw new Error("Format CSV illisible. Vérifiez les séparateurs et les guillemets.");
  }
  const [entete, ...lignes] = resultat.data;
  const colonnes = entete?.map((nom) => nom.trim().toLowerCase()) ?? [];
  if (colonnes.filter((nom) => nom === "email").length !== 1) {
    throw new Error("Le fichier doit contenir exactement une colonne nommée email.");
  }
  if (!lignes.length) throw new Error("Le fichier ne contient aucun élève.");
  if (lignes.length > MAX_LIGNES_IMPORT) throw new Error(`Limite de ${MAX_LIGNES_IMPORT} élèves par fichier.`);

  const colonneEmail = colonnes.indexOf("email");
  return lignes.map((ligne) => (ligne[colonneEmail] ?? "").trim().toLowerCase());
}

type EleveImport = { id: string; email: string; actif: boolean };

export function preparerListeInscriptions(emails: string[], eleves: EleveImport[], inscrits: ReadonlySet<string>) {
  const adresses = new Map<string, EleveImport>();
  for (const eleve of eleves) adresses.set(eleve.email.trim().toLowerCase(), eleve);
  const vus = new Set<string>();
  return emails.map((email) => {
    if (!emailValide.test(email)) return { email, statut: "Adresse invalide" } as const;
    if (vus.has(email)) return { email, statut: "Doublon dans le fichier" } as const;
    vus.add(email);
    const eleve = adresses.get(email);
    if (!eleve) return { email, statut: "Compte élève introuvable" } as const;
    if (!eleve.actif) return { email, statut: "Compte inactif" } as const;
    if (inscrits.has(eleve.id)) return { email, statut: "Déjà inscrit cette année" } as const;
    return { email, statut: "Prêt", eleveId: eleve.id } as const;
  });
}
