# Widget Studio

A custom widget designer built with Expo SDK 58.0.5 and React Native 0.88. Browse widget concepts, preview a design, and customize it for the home screen.

## Android APK from GitHub Actions

Every push to `main` builds a release-variant APK, uploads it as an Actions artifact, and publishes it as a GitHub Release named `build-N`. Open **Releases** to download the newest APK, or open **Actions → Android APK** and download the `widget-studio-release-apk` artifact. The Settings screen can check releases, download the APK, and open Android's installer confirmation. The workflow caches npm and Gradle files to speed up later builds. It builds APKs only; it does not build an AAB.

The APK version code follows the GitHub Actions run number so Android accepts a newer release as an update. Android requires the user to confirm APK installation, and the first update may require enabling “Install unknown apps” for Widget Studio. Updates must be signed with the same keystore as the installed app; configure a persistent upload keystore in GitHub Actions secrets before distributing upgrades broadly.

The generated APK uses the Expo template's debug signing key for convenient testing and sideloading. Configure a private upload keystore and GitHub Actions secrets before distributing a production build or publishing to Google Play.

## Local development

```sh
npm install
npm start
```

Native widgets, Calendar, and HealthKit / Health Connect require a development build; Expo Go does not include those native modules.
