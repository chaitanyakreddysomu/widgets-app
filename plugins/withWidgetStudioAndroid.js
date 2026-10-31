const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withWidgetStudioAndroid(config) {
  if (process.env.GITHUB_RUN_NUMBER) config.android.versionCode = Number(process.env.GITHUB_RUN_NUMBER);
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0];
    app.$['android:usesCleartextTraffic'] ??= 'false';
    app['provider'] ??= [];
    app['provider'].push({
      $: { 'android:name': 'androidx.core.content.FileProvider', 'android:authorities': '${applicationId}.widgetstudio.files', 'android:exported': 'false', 'android:grantUriPermissions': 'true' },
      'meta-data': [{ $: { 'android:name': 'android.support.FILE_PROVIDER_PATHS', 'android:resource': '@xml/widget_studio_file_paths' } }],
    });
    mod.modResults.manifest['uses-permission'] ??= [];
    if (!mod.modResults.manifest['uses-permission'].some((permission) => permission.$['android:name'] === 'android.permission.REQUEST_INSTALL_PACKAGES')) {
      mod.modResults.manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' } });
    }
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    const packageName = mod.modResults.package ?? 'com.widgetstudio.customwidgets';
    const importLine = `import ${packageName}.WidgetStudioNativePackage`;
    if (!mod.modResults.contents.includes(importLine)) {
      mod.modResults.contents = mod.modResults.contents.replace(/(package [^\n]+\n)/, `$1\n${importLine}\n`);
      mod.modResults.contents = mod.modResults.contents.replace(/(PackageList\(this\)\.packages\.apply\s*\{)/, '$1\n        add(WidgetStudioNativePackage())');
    }
    return mod;
  });
  config = withDangerousMod(config, ['android', async (mod) => {
    const packageName = mod.android.package ?? 'com.widgetstudio.customwidgets';
    const sourceDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'java', ...packageName.split('.'));
    const xmlDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(xmlDir, { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'WidgetStudioNativePackage.kt'), `package ${packageName}\n\nimport android.appwidget.AppWidgetManager\nimport android.content.ComponentName\nimport android.content.Intent\nimport androidx.core.content.FileProvider\nimport com.facebook.react.ReactPackage\nimport com.facebook.react.bridge.*\nimport com.facebook.react.uimanager.ViewManager\nimport java.io.File\n\nclass WidgetStudioNativePackage : ReactPackage {\n  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WidgetStudioNativeModule(context))\n  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()\n}\n\nclass WidgetStudioNativeModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {\n  override fun getName() = "WidgetStudioNative"\n\n  @ReactMethod fun getBuildVersion(promise: Promise) {\n    try {\n      val info = reactApplicationContext.packageManager.getPackageInfo(reactApplicationContext.packageName, 0)\n      val version = if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()\n      promise.resolve(version.toString())\n    } catch (error: Exception) { promise.reject("VERSION_FAILED", error.message, error) }\n  }\n\n  @ReactMethod fun pinWidget(name: String, promise: Promise) {\n    try {\n      if (android.os.Build.VERSION.SDK_INT < 26) { promise.reject("UNSUPPORTED", "Home screen widget pinning needs Android 8 or newer."); return }\n      val manager = AppWidgetManager.getInstance(reactApplicationContext)\n      if (!manager.isRequestPinAppWidgetSupported) { promise.reject("UNSUPPORTED", "This launcher does not support direct widget adding. Add it from the launcher Widgets panel."); return }\n      val provider = ComponentName(reactApplicationContext.packageName, "\${reactApplicationContext.packageName}.\${name}Provider")\n      promise.resolve(manager.requestPinAppWidget(provider, null, null))\n    } catch (error: Exception) { promise.reject("PIN_FAILED", error.message, error) }\n  }\n\n  @ReactMethod fun installApk(path: String, promise: Promise) {\n    try {\n      if (android.os.Build.VERSION.SDK_INT >= 26 && !reactApplicationContext.packageManager.canRequestPackageInstalls()) {\n        val settings = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).setData(android.net.Uri.parse("package:\${reactApplicationContext.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)\n        reactApplicationContext.startActivity(settings)\n        promise.reject("INSTALL_PERMISSION", "Allow Widget Studio to install updates, then tap Download & install again.")\n        return\n      }\n      val apk = File(path)\n      if (!apk.exists()) { promise.reject("APK_MISSING", "The downloaded update could not be found."); return }\n      val uri = FileProvider.getUriForFile(reactApplicationContext, "\${reactApplicationContext.packageName}.widgetstudio.files", apk)\n      val intent = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)\n      reactApplicationContext.startActivity(intent)\n      promise.resolve(null)\n    } catch (error: Exception) { promise.reject("INSTALL_FAILED", error.message, error) }\n  }\n}\n`);
    fs.writeFileSync(path.join(xmlDir, 'widget_studio_file_paths.xml'), '<?xml version="1.0" encoding="utf-8"?><paths xmlns:android="http://schemas.android.com/apk/res/android"><cache-path name="updates" path="." /></paths>');
    return mod;
  }]);
  return config;
};
