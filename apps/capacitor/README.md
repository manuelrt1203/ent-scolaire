# @ent/capacitor — app mobile installable

Emballe `apps/web` (même code que le site et l'app desktop Electron) dans une
vraie app Android/iOS via [Capacitor](https://capacitorjs.com/) — icône sur
l'écran d'accueil, plein écran, installable comme n'importe quelle app.

## Comment ça marche

`capacitor.config.ts` pointe `webDir` vers `../web/dist` : Capacitor copie le
build web déjà existant dans les projets natifs `android/` et `ios/`. Aucun
écran n'est réécrit — c'est exactement l'appli web (donc aussi l'appli
desktop) qui tourne dans un conteneur natif.

## Prérequis (installés une fois sur cette machine)

Aucun JDK ni SDK Android n'était installé par défaut sur cet environnement.
Pour compiler un APK :

- **JDK 21** (avec `javac`, pas juste un JRE) : téléchargé dans
  `~/.local/jdks/jdk-21.0.12.1+1` (Eclipse Temurin, sans droits root).
- **Android SDK** : `cmdline-tools`, `platform-tools`, `platforms;android-36`
  et `build-tools;36.0.0` installés dans `~/.local/android-sdk` (sans droits
  root non plus — licences acceptées via `sdkmanager --licenses`).

Si tu changes de machine (ou installes Android Studio, qui gère tout ça tout
seul), adapte les chemins `JAVA_HOME`/`ANDROID_HOME` dans le script
`android:build` de `package.json`, ou laisse Android Studio les régler à ta
place.

## Commandes

```bash
npm run sync           # rebuild apps/web + copie dans android/ et ios/
npm run android:build  # build + génère un vrai APK debug (voir chemin ci-dessous)
npm run android        # build + ouvre le projet dans Android Studio
npm run ios            # build + ouvre le projet dans Xcode (nécessite macOS)
```

L'APK debug est généré dans
`android/app/build/outputs/apk/debug/app-debug.apk` — installable directement
sur un téléphone Android (active "Sources inconnues") ou via
`adb install app-debug.apk`.

iOS nécessite un Mac avec Xcode pour compiler — le projet `ios/` est prêt,
mais aucun build n'a été tenté ici (environnement Linux).
