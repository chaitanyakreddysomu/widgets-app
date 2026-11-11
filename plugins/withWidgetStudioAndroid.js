const { withAndroidManifest, withMainApplication, withMainActivity, withStringsXml, withAppBuildGradle, withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function ensureString(mod, name, value) {
  const strings = mod.modResults.resources.string ?? [];
  mod.modResults.resources.string = strings;
  if (!strings.some((item) => item.$.name === name)) strings.push({ $: { name }, _: value });
  return mod;
}

module.exports = function withWidgetStudioAndroid(config) {
  if (process.env.GITHUB_RUN_NUMBER) config.android.versionCode = Number(process.env.GITHUB_RUN_NUMBER);

  // Health Connect requires API 26+. ext.minSdkVersion must be set before the
  // expo-root-project plugin applies its own default (24), since it only sets
  // the value when it isn't already present on rootProject.ext.
  config = withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes("ext.minSdkVersion")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(apply plugin: "expo-root-project")/,
        'ext.minSdkVersion = 26\n\n$1',
      );
    }
    return mod;
  });

  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0];
    application.$['android:usesCleartextTraffic'] ??= 'false';

    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    if (!manifest['uses-permission'].some((item) => item.$['android:name'] === 'android.permission.POST_NOTIFICATIONS')) {
      manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' } });
    }
    if (!manifest['uses-permission'].some((item) => item.$['android:name'] === 'android.permission.REQUEST_INSTALL_PACKAGES')) {
      manifest['uses-permission'].push({ $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' } });
    }
    for (const healthPermission of ['android.permission.health.READ_STEPS', 'android.permission.health.READ_SLEEP']) {
      if (!manifest['uses-permission'].some((item) => item.$['android:name'] === healthPermission)) {
        manifest['uses-permission'].push({ $: { 'android:name': healthPermission } });
      }
    }

    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.package = queries.package ?? [];
    if (!queries.package.some((item) => item.$['android:name'] === 'com.google.android.apps.healthdata')) {
      queries.package.push({ $: { 'android:name': 'com.google.android.apps.healthdata' } });
    }

    application.provider = application.provider ?? [];
    if (!application.provider.some((item) => item.$['android:name'] === 'androidx.core.content.FileProvider')) {
      application.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': '${applicationId}.fileprovider',
          'android:exported': 'false',
          'android:grantUriPermissions': 'true',
        },
        'meta-data': [{ $: { 'android:name': 'android.support.FILE_PROVIDER_PATHS', 'android:resource': '@xml/file_paths' } }],
      });
    }

    const mainActivity = application.activity?.find((item) => item.$['android:name'] === '.MainActivity');
    if (mainActivity) {
      mainActivity['meta-data'] = mainActivity['meta-data'] ?? [];
      if (!mainActivity['meta-data'].some((item) => item.$['android:resource'] === '@xml/shortcuts')) {
        mainActivity['meta-data'].push({ $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/shortcuts' } });
      }
    }

    application['activity-alias'] = application['activity-alias'] ?? [];
    if (!application['activity-alias'].some((item) => item.$['android:name'] === '.HealthPermissionsRationaleActivity')) {
      application['activity-alias'].push({
        $: {
          'android:name': '.HealthPermissionsRationaleActivity',
          'android:exported': 'true',
          'android:targetActivity': '.MainActivity',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
          category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
        }],
      });
    }

    application.service = application.service ?? [];
    if (!application.service.some((item) => item.$['android:name'] === '.WidgetStudioTileService')) {
      application.service.push({
        $: {
          'android:name': '.WidgetStudioTileService',
          'android:exported': 'true',
          'android:icon': '@mipmap/ic_launcher',
          'android:label': '@string/quick_settings_tile_label',
          'android:permission': 'android.permission.BIND_QUICK_SETTINGS_TILE',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.quicksettings.action.QS_TILE' } }] }],
      });
    }
    return mod;
  });

  config = withStringsXml(config, (mod) => {
    ensureString(mod, 'shortcut_create_label', 'Create widget');
    ensureString(mod, 'shortcut_create_long_label', 'Create a new widget');
    ensureString(mod, 'shortcut_settings_label', 'Settings');
    ensureString(mod, 'shortcut_settings_long_label', 'Open Studio settings');
    ensureString(mod, 'quick_settings_tile_label', 'Widget Studio');
    ensureString(mod, 'notification_channel_name', 'Widget Studio');
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('androidx.core:core-ktx')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(implementation\("com\.facebook\.react:react-android"\))/,
        '$1\n    implementation("androidx.core:core-ktx:1.13.1")\n    implementation("androidx.health.connect:connect-client:1.1.0")\n    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")',
      );
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

  config = withMainActivity(config, (mod) => {
    if (!mod.modResults.contents.includes('onNewIntent')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(import android\.os\.Bundle\n)/,
        `$1import android.content.Intent\n`,
      );
      mod.modResults.contents = mod.modResults.contents.replace(
        /(super\.onCreate\(null\)\n\s*\}\n)/,
        `$1\n  override fun onNewIntent(intent: Intent) {\n    super.onNewIntent(intent)\n    setIntent(intent)\n  }\n`,
      );
    }
    if (!mod.modResults.contents.includes('healthPermissionLauncher')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(import expo\.modules\.ReactActivityDelegateWrapper\n)/,
        `$1\nimport androidx.health.connect.client.PermissionController\n`,
      );
      mod.modResults.contents = mod.modResults.contents.replace(
        /(class MainActivity : ReactActivity\(\) \{\n)/,
        `$1\n  private val healthPermissionLauncher = registerForActivityResult(\n    PermissionController.createRequestPermissionResultContract()\n  ) { granted ->\n    val promise = HealthPermissionBridge.pendingPromise\n    val required = HealthPermissionBridge.requiredPermissions\n    HealthPermissionBridge.pendingPromise = null\n    promise?.resolve(required.isNotEmpty() && granted.containsAll(required))\n  }\n\n  fun launchHealthPermissionRequest(permissions: Set<String>) {\n    healthPermissionLauncher.launch(permissions)\n  }\n`,
      );
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

import android.app.NotificationChannel
import android.app.NotificationManager
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import org.json.JSONObject

const val NOTIFICATION_CHANNEL_ID = "widget_studio_general"
const val UPDATE_REPO = "chaitanyakreddysomu/widgets-app"

object HealthPermissionBridge {
  var pendingPromise: Promise? = null
  var requiredPermissions: Set<String> = emptySet()
}

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

  @ReactMethod fun getLaunchShortcutAction(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    val action = activity?.intent?.getStringExtra("shortcut_action")
    activity?.intent?.removeExtra("shortcut_action")
    promise.resolve(action)
  }

  @ReactMethod fun showStyledNotification(title: String, message: String, accentColorHex: String, promise: Promise) {
    try {
      val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)!!
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, reactApplicationContext.getString(R.string.notification_channel_name), NotificationManager.IMPORTANCE_DEFAULT)
        manager.createNotificationChannel(channel)
      }
      val accent = try { Color.parseColor(accentColorHex) } catch (error: IllegalArgumentException) { Color.parseColor("#D7F36A") }
      val notification = NotificationCompat.Builder(reactApplicationContext, NOTIFICATION_CHANNEL_ID)
        .setContentTitle(title)
        .setContentText(message)
        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
        .setColor(accent)
        .setColorized(true)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()
      manager.notify(1001, notification)
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("NOTIFICATION_FAILED", error.message, error) }
  }

  @ReactMethod fun checkForUpdate(promise: Promise) {
    Thread {
      try {
        val url = URL("https://api.github.com/repos/\${UPDATE_REPO}/releases/latest")
        val connection = url.openConnection() as HttpURLConnection
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        val body = connection.inputStream.bufferedReader().readText()
        connection.disconnect()
        val json = JSONObject(body)
        val tagName = json.optString("tag_name", "")
        val notes = json.optString("body", "")
        var downloadUrl: String? = null
        val assets = json.optJSONArray("assets")
        if (assets != null) {
          for (i in 0 until assets.length()) {
            val asset = assets.getJSONObject(i)
            if (asset.optString("name").endsWith(".apk")) {
              downloadUrl = asset.optString("browser_download_url")
              break
            }
          }
        }
        val info = reactApplicationContext.packageManager.getPackageInfo(reactApplicationContext.packageName, 0)
        val currentVersion = if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()
        val latestRunNumber = tagName.removePrefix("build-").toLongOrNull()
        val available = downloadUrl != null && latestRunNumber != null && latestRunNumber > currentVersion
        val result = Arguments.createMap().apply {
          putBoolean("available", available)
          putString("tagName", tagName)
          putString("notes", notes)
          putString("downloadUrl", downloadUrl ?: "")
        }
        promise.resolve(result)
      } catch (error: Exception) { promise.reject("UPDATE_CHECK_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun downloadAndInstallUpdate(downloadUrl: String, promise: Promise) {
    Thread {
      try {
        val url = URL(downloadUrl)
        val connection = url.openConnection() as HttpURLConnection
        connection.connectTimeout = 15000
        connection.readTimeout = 60000
        connection.instanceFollowRedirects = true
        val file = File(reactApplicationContext.cacheDir, "update.apk")
        connection.inputStream.use { input -> FileOutputStream(file).use { output -> input.copyTo(output) } }
        connection.disconnect()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !reactApplicationContext.packageManager.canRequestPackageInstalls()) {
          val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:\${reactApplicationContext.packageName}"))
          settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          reactApplicationContext.startActivity(settingsIntent)
          promise.reject("INSTALL_PERMISSION_NEEDED", "Allow Customize Studio to install unknown apps, then try again.")
          return@Thread
        }

        val apkUri = FileProvider.getUriForFile(reactApplicationContext, "\${reactApplicationContext.packageName}.fileprovider", file)
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(apkUri, "application/vnd.android.package-archive")
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(installIntent)
        promise.resolve(true)
      } catch (error: Exception) { promise.reject("UPDATE_INSTALL_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun isHealthConnectAvailable(promise: Promise) {
    try {
      val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
      promise.resolve(status == HealthConnectClient.SDK_AVAILABLE)
    } catch (error: Exception) { promise.reject("HEALTH_STATUS_FAILED", error.message, error) }
  }

  @ReactMethod fun requestHealthPermissions(permissions: ReadableArray, promise: Promise) {
    val activity = reactApplicationContext.currentActivity as? MainActivity
    if (activity == null) { promise.reject("NO_ACTIVITY", "Bring Customize Studio to the foreground and try again."); return }
    val permissionSet = permissions.toArrayList().map { it.toString() }.toSet()
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val client = HealthConnectClient.getOrCreate(reactApplicationContext)
        val granted = client.permissionController.getGrantedPermissions()
        if (granted.containsAll(permissionSet)) { promise.resolve(true); return@launch }
        HealthPermissionBridge.pendingPromise = promise
        HealthPermissionBridge.requiredPermissions = permissionSet
        activity.runOnUiThread { activity.launchHealthPermissionRequest(permissionSet) }
      } catch (error: Exception) { promise.reject("HEALTH_PERMISSION_FAILED", error.message, error) }
    }
  }

  @ReactMethod fun getStepsToday(promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val client = HealthConnectClient.getOrCreate(reactApplicationContext)
        val now = Instant.now()
        val startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()
        val response = client.aggregate(
          AggregateRequest(
            metrics = setOf(StepsRecord.COUNT_TOTAL),
            timeRangeFilter = TimeRangeFilter.between(startOfDay, now),
          )
        )
        promise.resolve((response[StepsRecord.COUNT_TOTAL] ?: 0L).toString())
      } catch (error: Exception) { promise.reject("STEPS_FAILED", error.message, error) }
    }
  }

  @ReactMethod fun getSleepLastNight(promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      try {
        val client = HealthConnectClient.getOrCreate(reactApplicationContext)
        val now = Instant.now()
        val from = now.minus(Duration.ofDays(1))
        val records = client.readRecords(
          ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = TimeRangeFilter.between(from, now))
        ).records
        val totalMinutes = records.sumOf { Duration.between(it.startTime, it.endTime).toMinutes() }
        promise.resolve(totalMinutes.toString())
      } catch (error: Exception) { promise.reject("SLEEP_FAILED", error.message, error) }
    }
  }
}
`);
    fs.writeFileSync(path.join(sourceDir, 'WidgetStudioTileService.kt'), `package ${packageName}

import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
class WidgetStudioTileService : TileService() {
  override fun onStartListening() {
    super.onStartListening()
    qsTile?.apply {
      label = getString(R.string.quick_settings_tile_label)
      state = Tile.STATE_INACTIVE
      updateTile()
    }
  }

  override fun onClick() {
    super.onClick()
    val launchIntent = Intent(this, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra("shortcut_action", "create_widget")
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startActivityAndCollapse(
        android.app.PendingIntent.getActivity(
          this, 0, launchIntent,
          android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT,
        )
      )
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(launchIntent)
    }
  }
}
`);
    fs.writeFileSync(path.join(xmlDir, 'shortcuts.xml'), `<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="create_widget"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/shortcut_create_label"
    android:shortcutLongLabel="@string/shortcut_create_long_label">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${packageName}"
      android:targetClass="${packageName}.MainActivity">
      <extra android:name="shortcut_action" android:value="create_widget" />
    </intent>
  </shortcut>
  <shortcut
    android:shortcutId="open_settings"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/shortcut_settings_label"
    android:shortcutLongLabel="@string/shortcut_settings_long_label">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${packageName}"
      android:targetClass="${packageName}.MainActivity">
      <extra android:name="shortcut_action" android:value="open_settings" />
    </intent>
  </shortcut>
</shortcuts>
`);
    fs.writeFileSync(path.join(xmlDir, 'file_paths.xml'), `<paths xmlns:android="http://schemas.android.com/apk/res/android">
  <cache-path name="updates" path="." />
</paths>
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
