// Polyfill WebSocket pour Node 20 (natif seulement depuis Node 22).
// Nécessaire uniquement pour ce script CLI : le renderer Electron et
// l'app mobile ont un WebSocket natif (environnement navigateur), donc
// n'ont pas besoin de ce polyfill.
globalThis.WebSocket = require("ws");
