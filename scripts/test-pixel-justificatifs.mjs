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
const pieces = new Map();
const stockage = "/storage/v1/object/vie-scolaire-justificatifs/";
const liensSignes = "/storage/v1/object/sign/vie-scolaire-justificatifs/";
const typesAcceptes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const tailleMaximale = 20 * 1024 * 1024;
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
    if (req.method === "GET" && cible.pathname.startsWith(liensSignes)) {
      const chemin = decodeURIComponent(cible.pathname.slice(liensSignes.length));
      const piece = pieces.get(chemin);
      if (!piece?.signature || piece.signature !== cible.searchParams.get("token") || piece.expiration <= Date.now()) {
        return repondre(403, { message: "Lien de test invalide ou expiré" });
      }
      res.writeHead(200, {
        "content-type": piece.type,
        "content-length": piece.taille,
        "content-disposition": "inline",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      return res.end(piece.contenu);
    }
    if (req.headers.authorization !== `Bearer ${token}`) return repondre(401, { message: "Connexion requise" });
    if (cible.pathname === "/auth/v1/user" || cible.pathname === "/rest/v1/profiles") return repondre(200, user);
    if (cible.pathname === "/rest/v1/vie_scolaire_evenements") return repondre(200, dossiers);
    if (cible.pathname === "/rest/v1/etablissements") return repondre(200, { id: user.etablissement_id, nom: "École fictive", pays_calendrier: "CG" });

    if (req.method === "POST" && cible.pathname.startsWith(liensSignes)) {
      const chemin = decodeURIComponent(cible.pathname.slice(liensSignes.length));
      const piece = pieces.get(chemin);
      if (!piece) return repondre(404, { message: "Justificatif introuvable" });
      const { expiresIn } = await lireJson(req);
      const secondes = Number.isFinite(expiresIn) ? Math.max(1, Math.min(3600, expiresIn)) : 3600;
      piece.signature = randomBytes(24).toString("hex");
      piece.expiration = Date.now() + secondes * 1000;
      const cheminUrl = chemin.split("/").map(encodeURIComponent).join("/");
      return repondre(200, { signedURL: `/object/sign/vie-scolaire-justificatifs/${cheminUrl}?token=${piece.signature}` });
    }
    if (req.method === "POST" && cible.pathname.startsWith(stockage)) {
      const chemin = decodeURIComponent(cible.pathname.slice(stockage.length));
      const dossier = dossiers.find(({ id }) => chemin.startsWith(`${id}/`));
      if (!dossier || dossier.justificatif_chemin) return repondre(400, { message: "Absence indisponible" });
      const type = req.headers["content-type"];
      if (!typesAcceptes.has(type)) return repondre(400, { message: "Photo ou PDF requis" });
      const blocs = [];
      let taille = 0;
      for await (const chunk of req) {
        taille += chunk.length;
        if (taille <= tailleMaximale) blocs.push(chunk);
      }
      if (!taille || taille > tailleMaximale) return repondre(400, { message: "Fichier vide ou supérieur à 20 Mo" });
      transferts.set(dossier.id, { chemin, type, taille, contenu: Buffer.concat(blocs) });
      return repondre(200, { Key: chemin });
    }
    if (cible.pathname === "/rest/v1/rpc/ajouter_justificatif_absence") {
      const { p_vie_scolaire_id, p_chemin } = await lireJson(req);
      const dossier = dossiers.find(({ id }) => id === p_vie_scolaire_id);
      const transfert = transferts.get(p_vie_scolaire_id);
      if (!dossier || dossier.justificatif_chemin || transfert?.chemin !== p_chemin) return repondre(400, { message: "Pièce inconnue" });
      dossier.justificatif_chemin = p_chemin;
      pieces.set(p_chemin, transfert);
      transferts.delete(dossier.id);
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
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: adresse, EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: "cle-fictive", EXPO_PUBLIC_ENT_TEST_PIXEL: "1" },
  });
  expo.on("error", (error) => { console.error(error.message); serveur.close(); process.exitCode = 1; });
  expo.on("exit", (code) => { serveur.close(); process.exitCode = code ?? 0; });
  process.on("SIGINT", () => expo.kill("SIGINT"));
  process.on("SIGTERM", () => expo.kill("SIGTERM"));
});
