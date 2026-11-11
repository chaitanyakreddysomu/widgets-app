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
    if (!application.service.some((item) => item.$['android:name'] === '.DepthWallpaperService')) {
      application.service.push({
        $: {
          'android:name': '.DepthWallpaperService',
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_WALLPAPER',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.wallpaper.WallpaperService' } }] }],
        'meta-data': [{ $: { 'android:name': 'android.service.wallpaper', 'android:resource': '@xml/depth_wallpaper' } }],
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
    ensureString(mod, 'depth_wallpaper_description', 'Customize Studio depth wallpaper, with a cut-out subject that shifts over a blurred background.');
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('androidx.core:core-ktx')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(implementation\("com\.facebook\.react:react-android"\))/,
        '$1\n    implementation("androidx.core:core-ktx:1.13.1")\n    implementation("androidx.health.connect:connect-client:1.1.0")\n    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")\n    implementation("com.google.mlkit:subject-segmentation:16.0.0-beta1")\n    implementation("com.google.android.gms:play-services-tasks:18.2.0")',
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
    if (!mod.modResults.contents.includes('imagePickerLauncher')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /(import android\.content\.Intent\n)/,
        `$1import android.net.Uri\nimport androidx.activity.result.contract.ActivityResultContracts\n`,
      );
      mod.modResults.contents = mod.modResults.contents.replace(
        /(fun launchHealthPermissionRequest\(permissions: Set<String>\) \{\n\s*healthPermissionLauncher\.launch\(permissions\)\n\s*\}\n)/,
        `$1\n  private val imagePickerLauncher = registerForActivityResult(\n    ActivityResultContracts.OpenDocument()\n  ) { uri: Uri? -> ImagePickerBridge.deliver(this, uri) }\n\n  fun launchImagePicker() {\n    imagePickerLauncher.launch(arrayOf("image/*"))\n  }\n`,
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
import android.app.WallpaperManager
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
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
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
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
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import org.json.JSONObject

const val NOTIFICATION_CHANNEL_ID = "widget_studio_general"
const val UPDATE_REPO = "chaitanyakreddysomu/widgets-app"

object HealthPermissionBridge {
  var pendingPromise: Promise? = null
  var requiredPermissions: Set<String> = emptySet()
}

object ImagePickerBridge {
  var pendingPromise: Promise? = null

  fun deliver(activity: android.app.Activity, uri: Uri?) {
    val promise = pendingPromise
    pendingPromise = null
    if (promise == null) return
    if (uri == null) { promise.resolve(null); return }
    Thread {
      try {
        val input = activity.contentResolver.openInputStream(uri)
        if (input == null) { promise.reject("PICK_FAILED", "Could not open the selected image."); return@Thread }
        val file = File(activity.cacheDir, "wallpaper_pick_\${System.currentTimeMillis()}.jpg")
        input.use { stream -> FileOutputStream(file).use { output -> stream.copyTo(output) } }
        promise.resolve(file.absolutePath)
      } catch (error: Exception) {
        promise.reject("PICK_FAILED", error.message, error)
      }
    }.start()
  }
}

private fun wallpaperFlags(target: String): Int = when (target) {
  "home" -> WallpaperManager.FLAG_SYSTEM
  "lock" -> WallpaperManager.FLAG_LOCK
  else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
}

private fun blurredDownscale(bitmap: Bitmap): Bitmap {
  val smallWidth = (bitmap.width / 16).coerceAtLeast(1)
  val smallHeight = (bitmap.height / 16).coerceAtLeast(1)
  val small = Bitmap.createScaledBitmap(bitmap, smallWidth, smallHeight, true)
  return Bitmap.createScaledBitmap(small, bitmap.width, bitmap.height, true)
}

private fun depthTypefaceFor(name: String): Typeface = when (name) {
  "Serif" -> Typeface.create(Typeface.SERIF, Typeface.BOLD)
  "Monospace" -> Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
  "Condensed" -> Typeface.create("sans-serif-condensed", Typeface.BOLD)
  "Light" -> Typeface.create("sans-serif-light", Typeface.NORMAL)
  else -> Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
}

private fun depthDateFormatterFor(id: String): DateTimeFormatter = when (id) {
  "dd/mm/yy" -> DateTimeFormatter.ofPattern("dd/MM/yy")
  "dd-MMM-yyyy" -> DateTimeFormatter.ofPattern("dd - MMM- yyyy")
  "dd MMMM" -> DateTimeFormatter.ofPattern("dd MMMM")
  "dd MMMM yyyy" -> DateTimeFormatter.ofPattern("dd MMMM yyyy")
  "mm/dd/yyyy" -> DateTimeFormatter.ofPattern("MM/dd/yyyy")
  else -> DateTimeFormatter.ofPattern("dd/MM/yyyy")
}

private fun drawDepthLayer(canvas: Canvas, bitmap: Bitmap, paint: Paint) {
  val canvasWidth = canvas.width.toFloat()
  val canvasHeight = canvas.height.toFloat()
  val scale = maxOf(canvasWidth / bitmap.width, canvasHeight / bitmap.height)
  val scaledWidth = bitmap.width * scale
  val scaledHeight = bitmap.height * scale
  val left = (canvasWidth - scaledWidth) / 2f
  val top = (canvasHeight - scaledHeight) / 2f
  canvas.drawBitmap(bitmap, null, RectF(left, top, left + scaledWidth, top + scaledHeight), paint)
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

  @ReactMethod fun pickWallpaperImage(promise: Promise) {
    val activity = reactApplicationContext.currentActivity as? MainActivity
    if (activity == null) { promise.reject("NO_ACTIVITY", "Bring Customize Studio to the foreground and try again."); return }
    ImagePickerBridge.pendingPromise = promise
    activity.runOnUiThread { activity.launchImagePicker() }
  }

  @ReactMethod fun setWallpaperFromPath(path: String, target: String, promise: Promise) {
    Thread {
      try {
        val bitmap = BitmapFactory.decodeFile(path) ?: throw IllegalStateException("Could not read the selected image.")
        val manager = WallpaperManager.getInstance(reactApplicationContext)
        manager.setBitmap(bitmap, null, true, wallpaperFlags(target))
        promise.resolve(true)
      } catch (error: Exception) { promise.reject("WALLPAPER_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun setGradientWallpaper(colors: ReadableArray, target: String, promise: Promise) {
    Thread {
      try {
        val parsed = colors.toArrayList().map { Color.parseColor(it.toString()) }.toIntArray()
        val manager = WallpaperManager.getInstance(reactApplicationContext)
        val width = manager.desiredMinimumWidth.takeIf { it > 0 } ?: 1080
        val height = manager.desiredMinimumHeight.takeIf { it > 0 } ?: 1920
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val gradientShader = LinearGradient(0f, 0f, 0f, height.toFloat(), parsed, null, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), Paint().apply { shader = gradientShader })
        manager.setBitmap(bitmap, null, true, wallpaperFlags(target))
        promise.resolve(true)
      } catch (error: Exception) { promise.reject("WALLPAPER_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun openLiveWallpaperPicker(promise: Promise) {
    try {
      val intent = Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("LIVE_WALLPAPER_UNAVAILABLE", error.message, error) }
  }

  @ReactMethod fun openWallpaperSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_WALLPAPER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      try {
        val fallback = Intent(Intent.ACTION_SET_WALLPAPER).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(fallback)
        promise.resolve(true)
      } catch (fallbackError: Exception) { promise.reject("SETTINGS_UNAVAILABLE", fallbackError.message, fallbackError) }
    }
  }

  @ReactMethod fun segmentWallpaperSubject(path: String, promise: Promise) {
    Thread {
      try {
        val original = BitmapFactory.decodeFile(path) ?: throw IllegalStateException("Could not read the selected image.")
        val options = SubjectSegmenterOptions.Builder().enableForegroundBitmap().build()
        val segmenter = SubjectSegmentation.getClient(options)
        val result: SubjectSegmentationResult = Tasks.await(segmenter.process(InputImage.fromBitmap(original, 0)))
        val foreground = result.foregroundBitmap ?: throw IllegalStateException("No subject was found in this photo.")
        val background = blurredDownscale(original)
        val stamp = System.currentTimeMillis()
        val fgFile = File(reactApplicationContext.cacheDir, "depth_fg_\${stamp}.png")
        val bgFile = File(reactApplicationContext.cacheDir, "depth_bg_\${stamp}.jpg")
        FileOutputStream(fgFile).use { foreground.compress(Bitmap.CompressFormat.PNG, 100, it) }
        FileOutputStream(bgFile).use { background.compress(Bitmap.CompressFormat.JPEG, 90, it) }
        promise.resolve(Arguments.createMap().apply {
          putString("foregroundPath", fgFile.absolutePath)
          putString("backgroundPath", bgFile.absolutePath)
        })
      } catch (error: Exception) { promise.reject("SEGMENT_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun setDepthWallpaperConfig(foregroundPath: String, backgroundPath: String, config: ReadableMap, promise: Promise) {
    try {
      reactApplicationContext.getSharedPreferences("depth_wallpaper", 0).edit()
        .putString("foreground", foregroundPath)
        .putString("background", backgroundPath)
        .putBoolean("clockEnabled", config.getBoolean("clockEnabled"))
        .putString("clockFont", config.getString("clockFont") ?: "Sans")
        .putBoolean("clockBehindSubject", config.getBoolean("clockBehindSubject"))
        .putFloat("clockSize", config.getDouble("clockSize").toFloat())
        .putFloat("clockX", config.getDouble("clockX").toFloat())
        .putFloat("clockY", config.getDouble("clockY").toFloat())
        .putBoolean("showDate", config.getBoolean("showDate"))
        .putString("dateFont", config.getString("dateFont") ?: "Sans")
        .putString("dateFormat", config.getString("dateFormat") ?: "dd/mm/yyyy")
        .putFloat("dateX", config.getDouble("dateX").toFloat())
        .putFloat("dateY", config.getDouble("dateY").toFloat())
        .apply()
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("DEPTH_SAVE_FAILED", error.message, error) }
  }

  @ReactMethod fun renderDepthSnapshot(foregroundPath: String, backgroundPath: String, config: ReadableMap, promise: Promise) {
    // Android has no public API to run a live wallpaper behind the lock screen --
    // that surface only ever shows a static bitmap. This renders one still frame
    // of the exact same composition (same position/size/font/behind-subject state)
    // so the lock screen matches what the live home-screen wallpaper looks like.
    Thread {
      try {
        val background = BitmapFactory.decodeFile(backgroundPath) ?: throw IllegalStateException("Missing background layer.")
        val foreground = BitmapFactory.decodeFile(foregroundPath)
        val manager = WallpaperManager.getInstance(reactApplicationContext)
        val width = manager.desiredMinimumWidth.takeIf { it > 0 } ?: background.width
        val height = manager.desiredMinimumHeight.takeIf { it > 0 } ?: background.height
        val output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val layerPaint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
        val clockEnabled = config.getBoolean("clockEnabled")
        val clockBehindSubject = config.getBoolean("clockBehindSubject")
        val clockSize = config.getDouble("clockSize").toFloat()
        val showDate = config.getBoolean("showDate")
        val clockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.WHITE; textAlign = Paint.Align.CENTER
          typeface = depthTypefaceFor(config.getString("clockFont") ?: "Sans")
          textSize = height * 0.09f * clockSize
        }
        val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
          color = Color.WHITE; textAlign = Paint.Align.CENTER
          typeface = depthTypefaceFor(config.getString("dateFont") ?: "Sans")
          textSize = height * 0.032f * clockSize
        }
        val dateFormatter = depthDateFormatterFor(config.getString("dateFormat") ?: "dd/mm/yyyy")

        fun drawClock() = canvas.drawText(LocalTime.now().format(DateTimeFormatter.ofPattern("h:mm")), config.getDouble("clockX").toFloat() * width, config.getDouble("clockY").toFloat() * height, clockPaint)
        fun drawDate() = canvas.drawText(LocalDate.now().format(dateFormatter), config.getDouble("dateX").toFloat() * width, config.getDouble("dateY").toFloat() * height, datePaint)

        drawDepthLayer(canvas, background, layerPaint)
        if (clockBehindSubject) {
          if (clockEnabled) drawClock()
          if (showDate) drawDate()
        }
        if (foreground != null) drawDepthLayer(canvas, foreground, layerPaint)
        if (!clockBehindSubject) {
          if (clockEnabled) drawClock()
          if (showDate) drawDate()
        }

        val file = File(reactApplicationContext.cacheDir, "depth_snapshot_\${System.currentTimeMillis()}.png")
        FileOutputStream(file).use { output.compress(Bitmap.CompressFormat.PNG, 100, it) }
        promise.resolve(file.absolutePath)
      } catch (error: Exception) { promise.reject("SNAPSHOT_FAILED", error.message, error) }
    }.start()
  }

  @ReactMethod fun openDepthWallpaperPicker(promise: Promise) {
    try {
      val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
        putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, ComponentName(reactApplicationContext, DepthWallpaperService::class.java))
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("DEPTH_PICKER_UNAVAILABLE", error.message, error) }
  }
}
`);
    fs.writeFileSync(path.join(sourceDir, 'DepthWallpaperService.kt'), `package ${packageName}

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

// Real parallax "depth" wallpaper: a foreground subject (cut out on-device via
// ML Kit subject segmentation) floats over a blurred background. Shifts come
// from the launcher's home-screen paging offset AND the accelerometer, the
// same two motion sources Samsung/Pixel depth wallpapers react to.
class DepthWallpaperService : WallpaperService() {
  override fun onCreateEngine(): Engine = DepthEngine()

  inner class DepthEngine : Engine(), SensorEventListener {
    private val handler = Handler(Looper.getMainLooper())
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
    private val clockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; textAlign = Paint.Align.CENTER }
    private val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; textAlign = Paint.Align.CENTER }
    private val timeFormatter = DateTimeFormatter.ofPattern("h:mm")
    private var dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val prefs by lazy { getSharedPreferences("depth_wallpaper", MODE_PRIVATE) }
    private val sensorManager by lazy { getSystemService(SENSOR_SERVICE) as SensorManager }
    private var foreground: Bitmap? = null
    private var background: Bitmap? = null
    private var clockEnabled = false
    private var clockBehindSubject = false
    private var clockSize = 1f
    private var clockX = 0.5f
    private var clockY = 0.22f
    private var showDate = false
    private var dateX = 0.5f
    private var dateY = 0.34f
    private var pageOffset = 0f
    private var tiltX = 0f
    private var tiltY = 0f
    private var running = false
    private val drawRunner = Runnable { draw() }

    private fun typefaceFor(name: String): Typeface = when (name) {
      "Serif" -> Typeface.create(Typeface.SERIF, Typeface.BOLD)
      "Monospace" -> Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
      "Condensed" -> Typeface.create("sans-serif-condensed", Typeface.BOLD)
      "Light" -> Typeface.create("sans-serif-light", Typeface.NORMAL)
      else -> Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
    }

    private fun dateFormatterFor(id: String): DateTimeFormatter = when (id) {
      "dd/mm/yy" -> DateTimeFormatter.ofPattern("dd/MM/yy")
      "dd-MMM-yyyy" -> DateTimeFormatter.ofPattern("dd - MMM- yyyy")
      "dd MMMM" -> DateTimeFormatter.ofPattern("dd MMMM")
      "dd MMMM yyyy" -> DateTimeFormatter.ofPattern("dd MMMM yyyy")
      "mm/dd/yyyy" -> DateTimeFormatter.ofPattern("MM/dd/yyyy")
      else -> DateTimeFormatter.ofPattern("dd/MM/yyyy")
    }

    private fun loadLayers() {
      foreground = prefs.getString("foreground", null)?.let { BitmapFactory.decodeFile(it) }
      background = prefs.getString("background", null)?.let { BitmapFactory.decodeFile(it) }
      clockEnabled = prefs.getBoolean("clockEnabled", false)
      clockBehindSubject = prefs.getBoolean("clockBehindSubject", false)
      clockSize = prefs.getFloat("clockSize", 1f)
      clockX = prefs.getFloat("clockX", 0.5f)
      clockY = prefs.getFloat("clockY", 0.22f)
      showDate = prefs.getBoolean("showDate", false)
      dateX = prefs.getFloat("dateX", 0.5f)
      dateY = prefs.getFloat("dateY", 0.34f)
      clockPaint.typeface = typefaceFor(prefs.getString("clockFont", "Sans") ?: "Sans")
      datePaint.typeface = typefaceFor(prefs.getString("dateFont", "Sans") ?: "Sans")
      dateFormatter = dateFormatterFor(prefs.getString("dateFormat", "dd/mm/yyyy") ?: "dd/mm/yyyy")
    }

    private fun drawClock(canvas: Canvas) {
      clockPaint.textSize = canvas.height * 0.09f * clockSize
      canvas.drawText(LocalTime.now().format(timeFormatter), clockX * canvas.width, clockY * canvas.height, clockPaint)
    }

    private fun drawDate(canvas: Canvas) {
      datePaint.textSize = canvas.height * 0.032f * clockSize
      canvas.drawText(LocalDate.now().format(dateFormatter), dateX * canvas.width, dateY * canvas.height, datePaint)
    }

    private fun drawLayer(canvas: Canvas, bitmap: Bitmap, shiftX: Float, shiftY: Float) {
      val canvasWidth = canvas.width.toFloat()
      val canvasHeight = canvas.height.toFloat()
      val scale = maxOf(canvasWidth / bitmap.width, canvasHeight / bitmap.height)
      val scaledWidth = bitmap.width * scale
      val scaledHeight = bitmap.height * scale
      val left = (canvasWidth - scaledWidth) / 2f + shiftX
      val top = (canvasHeight - scaledHeight) / 2f + shiftY
      canvas.drawBitmap(bitmap, null, RectF(left, top, left + scaledWidth, top + scaledHeight), paint)
    }

    private fun draw() {
      val holder = surfaceHolder
      var canvas: Canvas? = null
      try {
        canvas = holder.lockCanvas()
        if (canvas != null) {
          canvas.drawColor(Color.BLACK)
          val width = canvas.width.toFloat()
          val height = canvas.height.toFloat()
          val pagingShiftX = -pageOffset * width * 0.06f
          val tiltShiftX = tiltX * width * 0.02f
          val tiltShiftY = tiltY * height * 0.012f
          background?.let { drawLayer(canvas, it, pagingShiftX * 0.4f, 0f) }
          if (clockBehindSubject) {
            if (clockEnabled) drawClock(canvas)
            if (showDate) drawDate(canvas)
          }
          foreground?.let { drawLayer(canvas, it, pagingShiftX + tiltShiftX, tiltShiftY) }
          if (!clockBehindSubject) {
            if (clockEnabled) drawClock(canvas)
            if (showDate) drawDate(canvas)
          }
        }
      } finally {
        if (canvas != null) holder.unlockCanvasAndPost(canvas)
      }
      handler.removeCallbacks(drawRunner)
      if (running) handler.postDelayed(drawRunner, 32)
    }

    override fun onSurfaceCreated(holder: SurfaceHolder) {
      super.onSurfaceCreated(holder)
      loadLayers()
    }

    override fun onVisibilityChanged(visible: Boolean) {
      running = visible
      if (visible) {
        loadLayers()
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let { sensor ->
          sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
        }
        handler.post(drawRunner)
      } else {
        sensorManager.unregisterListener(this)
        handler.removeCallbacks(drawRunner)
      }
    }

    override fun onOffsetsChanged(xOffset: Float, yOffset: Float, xStep: Float, yStep: Float, xPixelOffset: Int, yPixelOffset: Int) {
      pageOffset = xOffset
      draw()
    }

    override fun onSensorChanged(event: SensorEvent) {
      if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return
      tiltX = (event.values[0] / 9.81f).coerceIn(-1f, 1f)
      tiltY = (event.values[1] / 9.81f).coerceIn(-1f, 1f)
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}

    override fun onSurfaceDestroyed(holder: SurfaceHolder) {
      super.onSurfaceDestroyed(holder)
      running = false
      sensorManager.unregisterListener(this)
      handler.removeCallbacks(drawRunner)
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
    fs.writeFileSync(path.join(xmlDir, 'depth_wallpaper.xml'), `<wallpaper xmlns:android="http://schemas.android.com/apk/res/android"
  android:thumbnail="@mipmap/ic_launcher"
  android:description="@string/depth_wallpaper_description" />
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
