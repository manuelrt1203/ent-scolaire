const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Le monorepo place node_modules à la racine (workspaces npm) : Metro doit
// aussi surveiller le dossier racine pour résoudre @ent/shared correctement.
config.watchFolders = [require("path").resolve(__dirname, "../..")];

module.exports = withNativeWind(config, { input: "./global.css" });
