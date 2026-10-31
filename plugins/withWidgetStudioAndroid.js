const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withWidgetStudioAndroid(config) {
  if (process.env.GITHUB_RUN_NUMBER) config.android.versionCode = Number(process.env.GITHUB_RUN_NUMBER);
  config = withAndroidManifest(config, (mod) => {
    mod.modResults.manifest.application[0].$['android:usesCleartextTraffic'] ??= 'false';
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
    fs.writeFileSync(path.join(sourceDir, 'WidgetStudioNativePackage.kt'), `package ${packageName}

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Environment
import android.os.StatFs
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class WidgetStudioNativePackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WidgetStudioNativeModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class WidgetStudioNativeModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "WidgetStudioNative"

  @ReactMethod fun getBuildVersion(promise: Promise) {
    try {
      val info = reactApplicationContext.packageManager.getPackageInfo(reactApplicationContext.packageName, 0)
      val version = if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()
      promise.resolve(version.toString())
    } catch (error: Exception) { promise.reject("VERSION_FAILED", error.message, error) }
  }

  @ReactMethod fun getStorageInfo(promise: Promise) {
    try {
      val stats = StatFs(Environment.getDataDirectory().absolutePath)
      val total = stats.totalBytes
      val available = stats.availableBytes
      promise.resolve(Arguments.createMap().apply {
        putDouble("totalBytes", total.toDouble())
        putDouble("availableBytes", available.toDouble())
        putDouble("usedBytes", (total - available).coerceAtLeast(0).toDouble())
      })
    } catch (error: Exception) { promise.reject("STORAGE_FAILED", error.message, error) }
  }

  @ReactMethod fun getAvailableWidgetSlot(names: ReadableArray, promise: Promise) {
    try {
      if (android.os.Build.VERSION.SDK_INT < 26) { promise.reject("UNSUPPORTED", "Home screen widget pinning needs Android 8 or newer."); return }
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      val freeName = names.toArrayList().asSequence().map { it.toString() }.firstOrNull { name ->
        val provider = ComponentName(reactApplicationContext.packageName, "\${reactApplicationContext.packageName}.\${name}Provider")
        manager.getAppWidgetIds(provider).isEmpty()
      }
      promise.resolve(freeName)
    } catch (error: Exception) { promise.reject("SLOT_FAILED", error.message, error) }
  }

  @ReactMethod fun pinWidget(name: String, promise: Promise) {
    try {
      if (android.os.Build.VERSION.SDK_INT < 26) { promise.reject("UNSUPPORTED", "Home screen widget pinning needs Android 8 or newer."); return }
      val manager = AppWidgetManager.getInstance(reactApplicationContext)
      if (!manager.isRequestPinAppWidgetSupported) { promise.reject("UNSUPPORTED", "This launcher does not support direct widget adding. Add it from the launcher Widgets panel."); return }
      val provider = ComponentName(reactApplicationContext.packageName, "\${reactApplicationContext.packageName}.\${name}Provider")
      promise.resolve(manager.requestPinAppWidget(provider, null, null))
    } catch (error: Exception) { promise.reject("PIN_FAILED", error.message, error) }
  }
}
`);
    for (const fileName of fs.readdirSync(xmlDir).filter((name) => name.endsWith('_info.xml'))) {
      const widgetInfoPath = path.join(xmlDir, fileName);
      const widgetInfo = fs.readFileSync(widgetInfoPath, 'utf8').replace(/android:updatePeriodMillis="\d+"/, 'android:updatePeriodMillis="1800000"');
      fs.writeFileSync(widgetInfoPath, widgetInfo);
    }
    return mod;
  }]);
  return config;
};
