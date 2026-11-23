import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { isIPv4 } from "node:net";
import { fileURLToPath } from "node:url";

const usb = process.argv[2] === "--usb";
const adresse = usb ? "127.0.0.1" : process.argv[2];
if (!usb && (!isIPv4(adresse) || adresse === "0.0.0.0" || adresse.startsWith("127."))) {
  console.error("Utilisation : node scripts/test-pixel-justificatifs.mjs --usb ou ADRESSE_IPV4_WIFI");
  process.exit(1);
}

const port = 8095;
const portExpo = 8081;
if (usb) {
  for (const portLocal of [portExpo, port]) {
    const cible = `tcp:${portLocal}`;
    const resultat = spawnSync("adb", ["-d", "reverse", cible, cible], { stdio: "inherit" });
    if (resultat.error?.code === "ENOENT") {
      console.error("ADB est absent. Installez le paquet adb avant de relancer le test.");
      process.exit(1);
    }
    if (resultat.status !== 0) {
      console.error("Vérifiez le câble, activez le débogage USB et acceptez l’autorisation sur le Pixel.");
      process.exit(1);
    }
  }
}
const url = `http://${adresse}:${port}`;
const email = "eleve@pixel.test";
const password = randomBytes(9).toString("hex");
const token = randomBytes(24).toString("hex");
const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email, role: "eleve", prenom: "Élève", nom: "Test", etablissement_id: "ecole-test", actif: true,
};
const dossiers = ["2026-11-20", "2026-11-21"].map((date, i) => ({
  id: `absence-${i + 1}`, date, eleve_id: user.id, type: "absence", justifie: false,
  justificatif_chemin: null, justificatif_motif_refus: null,
}));
const transferts = new Map();
const login = { access_token: token, refresh_token: token, token_type: "bearer", expires_in: 3600, user };

async function lireJson(req) {
  let contenu = "";
  for await (const chunk of req) {
    contenu += chunk;
    if (contenu.length > 4096) throw new Error("Requête trop longue");
  }
  return JSON.parse(contenu);
}

const serveur = createServer(async (req, res) => {
  const cible = new URL(req.url, url);
  const repondre = (status, data) => {
    res.writeHead(status, {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    });
    res.end(JSON.stringify(data));
  };
  if (req.method === "OPTIONS") return repondre(200, null);
  try {
    if (cible.pathname === "/auth/v1/token") {
      const body = await lireJson(req);
      if (body.email === email && body.password === password) return repondre(200, login);
      return repondre(400, { message: "Identifiants de test incorrects" });
    }
    if (req.headers.authorization !== `Bearer ${token}`) return repondre(401, { message: "Connexion requise" });
    if (cible.pathname === "/auth/v1/user" || cible.pathname === "/rest/v1/profiles") return repondre(200, user);
    if (cible.pathname === "/rest/v1/vie_scolaire_evenements") return repondre(200, dossiers);
    if (cible.pathname === "/rest/v1/etablissements") return repondre(200, { id: user.etablissement_id, nom: "École fictive", pays_calendrier: "CG" });

    const stockage = "/storage/v1/object/vie-scolaire-justificatifs/";
    if (req.method === "POST" && cible.pathname.startsWith(stockage)) {
      const chemin = decodeURIComponent(cible.pathname.slice(stockage.length));
      if (!dossiers.some(({ id }) => chemin.startsWith(`${id}/`))) return repondre(400, { message: "Absence inconnue" });
      let taille = 0;
      for await (const chunk of req) taille += chunk.length;
      const type = req.headers["content-type"];
      if (!taille || !type || !(type.startsWith("image/") || type === "application/pdf")) {
        return repondre(400, { message: "Photo ou PDF requis" });
      }
      transferts.set(chemin, { type, taille });
      return repondre(200, { Key: chemin });
    }
    if (cible.pathname === "/rest/v1/rpc/ajouter_justificatif_absence") {
      const { p_vie_scolaire_id, p_chemin } = await lireJson(req);
      const dossier = dossiers.find(({ id }) => id === p_vie_scolaire_id);
      const transfert = transferts.get(p_chemin);
      if (!dossier || !transfert || !p_chemin.startsWith(`${dossier.id}/`)) return repondre(400, { message: "Pièce inconnue" });
      dossier.justificatif_chemin = p_chemin;
      transferts.delete(p_chemin);
      console.log(`Justificatif en attente · ${dossier.date} · ${transfert.type} · ${transfert.taille} octets reçus`);
      return repondre(200, null);
    }
    return repondre(200, []);
  } catch {
    return repondre(400, { message: "Requête de test invalide" });
  }
});

serveur.listen(port, adresse, () => {
  console.log(`Compte fictif\nEmail ${email}\nMot de passe ${password}\nChoisir Vie scolaire puis envoyer un fichier fictif par absence.\n`);
  const cwd = fileURLToPath(new URL("../apps/mobile/", import.meta.url));
  const optionsExpo = usb ? ["--localhost", "--port", String(portExpo)] : ["--lan"];
  if (usb) console.log(`Dans Expo Go, ouvrez exp://127.0.0.1:${portExpo} (ou scannez le QR code).`);
  const expo = spawn("npx", ["expo", "start", "--go", ...optionsExpo], {
    cwd, stdio: "inherit",
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: adresse, EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: "cle-fictive" },
  });
  expo.on("error", (error) => { console.error(error.message); serveur.close(); process.exitCode = 1; });
  expo.on("exit", (code) => { serveur.close(); process.exitCode = code ?? 0; });
  process.on("SIGINT", () => expo.kill("SIGINT"));
  process.on("SIGTERM", () => expo.kill("SIGTERM"));
});
