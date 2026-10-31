# Widget Studio

A custom widget designer built with Expo SDK 58.0.5 and React Native 0.88. Browse widget concepts, preview a design, and customize it for the home screen.

## Android APK from GitHub Actions

Every push to `main` builds a release-variant APK. Open **Actions → Android APK** and download the `widget-studio-release-apk` artifact. The workflow caches npm and Gradle files to speed up later builds. It builds APKs only; it does not build an AAB.

To publish the APK on the GitHub Releases page, push a version tag such as `v1.0.0`. The same workflow attaches the APK to that release.

The generated APK uses the Expo template's debug signing key for convenient testing and sideloading. Configure a private upload keystore and GitHub Actions secrets before distributing a production build or publishing to Google Play.

## Local development

```sh
npm install
npm start
```

Native widgets, Calendar, and HealthKit / Health Connect require a development build; Expo Go does not include those native modules.
