package de.daraltawhid.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Message
import android.view.View
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var errorOverlay: LinearLayout
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingUrl: String = DarShell.LIVE_URL
    private var pendingGeoOrigin: String? = null
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingMicrophoneRequest: PermissionRequest? = null

    private val locationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val origin = pendingGeoOrigin
        val callback = pendingGeoCallback
        pendingGeoOrigin = null
        pendingGeoCallback = null
        if (origin != null && callback != null) {
            callback.invoke(origin, results.values.any { it }, false)
        }
    }

    private val microphonePermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val request = pendingMicrophoneRequest
        pendingMicrophoneRequest = null
        if (granted) {
            request?.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
        } else {
            request?.deny()
        }
    }

    private val fileChooser = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        filePathCallback?.onReceiveValue(uris)
        filePathCallback = null
    }

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) DarPush.bootstrap(application)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)
        errorOverlay = findViewById(R.id.errorOverlay)
        findViewById<Button>(R.id.retryButton).setOnClickListener {
            errorOverlay.visibility = View.GONE
            webView.loadUrl(pendingUrl)
        }

        if (android.os.Build.VERSION.SDK_INT >= 33) {
            notificationPermission.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString DarAlTawhidAndroid/${BuildConfig.VERSION_NAME}"
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            setGeolocationEnabled(true)
        }
        // Platform-specific Android bridge. Do not let the shared iOS web shell
        // overwrite the Android identity before its own scripts initialize.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                androidPlatformIdentityScript(),
                setOf("https://dar-al-tawhid.de", "https://www.dar-al-tawhid.de")
            )
        }
        webView.addJavascriptInterface(DarJsBridge(), "DarNative")
        webView.webViewClient = DarWebViewClient()
        webView.webChromeClient = DarChromeClient()

        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, bars.top, 0, bars.bottom)
            insets
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        pendingUrl = DarShell.inAppUrl(intent?.data)
        webView.loadUrl(pendingUrl)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val url = DarShell.inAppUrl(intent.data)
        pendingUrl = url
        webView.loadUrl(url)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        injectBridge()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        pendingGeoOrigin?.let { origin -> pendingGeoCallback?.invoke(origin, false, false) }
        pendingGeoOrigin = null
        pendingGeoCallback = null
        pendingMicrophoneRequest?.deny()
        pendingMicrophoneRequest = null
        webView.destroy()
        super.onDestroy()
    }

    private fun androidPlatformIdentityScript(): String = """
        (function () {
          if (!/DarAlTawhidAndroid/i.test(String(navigator.userAgent || ""))) return;
          window.DAR_ANDROID_NATIVE_APP = true;
          try {
            Object.defineProperty(window, "DAR_IOS_NATIVE_APP", {
              configurable: false, enumerable: true,
              get: function () { return false; },
              set: function () {}
            });
            Object.defineProperty(window, "DAR_OFFICIAL_IOS_APP", {
              configurable: false, enumerable: true,
              get: function () { return false; },
              set: function () {}
            });
          } catch (e) {
            window.DAR_IOS_NATIVE_APP = false;
            window.DAR_OFFICIAL_IOS_APP = false;
          }
          function repairAndroidStatus() {
            var box = document.getElementById("notificationHealthBox");
            if (!box) return;
            var chips = document.querySelectorAll(".notification-status-chip");
            for (var i = 0; i < chips.length; i++) {
              var chip = chips[i];
              if (chip.textContent.trim() === "iOS-App") chip.textContent = "Android-App";
            }
            var kind = box.querySelector(".notification-health__kind");
            if (kind && kind.textContent !== "Android Native") kind.textContent = "Android Native";
            var line = box.querySelector(".notification-health__line");
            if (!line) return;
            var granted = window.DAR_ANDROID_POST_NOTIFICATIONS_GRANTED === true;
            var sub = String(window.DAR_ANDROID_ONESIGNAL_ID || "").trim();
            var token = String(window.DAR_ANDROID_PUSH_TOKEN || "").trim();
            var status = !granted ? "Android-Benachrichtigungen nicht freigegeben" :
                !sub ? "Android-OneSignal-Registrierung fehlt" :
                !token ? "Android-FCM-Token fehlt" :
                "Android registriert · Server-Zustellung noch nicht bestätigt";
            if (line.textContent !== status) line.textContent = status;
            var warning = !granted || !sub || !token;
            if (line.classList.contains("notification-health__line--warn") !== warning) {
              line.classList.toggle("notification-health__line--warn", warning);
            }
          }
          var queued = false;
          function scheduleRepair() {
            if (queued) return;
            queued = true;
            setTimeout(function () { queued = false; repairAndroidStatus(); }, 120);
          }
          new MutationObserver(scheduleRepair).observe(document, {
            childList: true, subtree: true
          });
          document.addEventListener("DOMContentLoaded", scheduleRepair);
          window.addEventListener("darAndroidBridgeUpdated", scheduleRepair);
        })();
    """.trimIndent()

    private fun injectBridge() {
        val notificationsGranted = NotificationManagerCompat.from(this).areNotificationsEnabled() &&
            (android.os.Build.VERSION.SDK_INT < 33 ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)
        val device = DarPush.deviceId(this)
        val sub = DarPush.subscriptionId()
        val token = DarPush.pushToken()
        val js = """
            (function(){
              try{
                window.DAR_ANDROID_NATIVE_APP=true;
                window.DAR_ANDROID_NATIVE_PUSH=true;
                window.DAR_IOS_NATIVE_APP=false;
                window.DAR_ANDROID_POST_NOTIFICATIONS_GRANTED=${notificationsGranted};
                window.DAR_ANDROID_DEVICE_ID=${jsString(device)};
                window.DAR_ANDROID_ONESIGNAL_ID=${jsString(sub)};
                window.DAR_ANDROID_PUSH_TOKEN=${jsString(token)};
                try{localStorage.setItem("darPushExternalIdV1", window.DAR_ANDROID_DEVICE_ID)}catch(e){}
                var root=document.documentElement;
                if(root){
                  root.classList.add("dar-android-native-app");
                  root.classList.add("is-android");
                }
                window.Notification=window.Notification||function(){};
                try{Object.defineProperty(window.Notification,"permission",{configurable:true,get:function(){return "granted"}})}catch(e){}
                window.Notification.requestPermission=function(){return Promise.resolve("granted")};
                window.hasNotificationApi=function(){return true};
                window.getNotificationPermission=function(){return "granted"};
                window.requestNotificationPermission=function(){return Promise.resolve("granted")};
                function nativeReady(){
                  return {ready:true,optedIn:true,subscriptionId:window.DAR_ANDROID_ONESIGNAL_ID||"",token:window.DAR_ANDROID_PUSH_TOKEN||"",os:window.OneSignal||{}};
                }
                window.waitForPushSubscriptionReady=function(){return Promise.resolve(nativeReady())};
                window.waitForPushOptIn=function(){return Promise.resolve(true)};
                window.ensureOneSignalPushSubscription=function(){return Promise.resolve(true)};
                window.ensureOneSignalServiceWorkerReady=function(){return Promise.resolve(null)};
                window.getOneSignalServiceWorkerRegistration=function(){return Promise.resolve(null)};
                if(typeof readOneSignalPushSubscriptionState==="function"){
                  readOneSignalPushSubscriptionState=function(){
                    return {subscriptionId:window.DAR_ANDROID_ONESIGNAL_ID||"",token:window.DAR_ANDROID_PUSH_TOKEN||"",optedIn:true,ready:!!window.DAR_ANDROID_ONESIGNAL_ID};
                  };
                }
                var hideSave=document.createElement("style");
                hideSave.textContent="html.dar-android-native-app #footerAppSave,html.dar-android-native-app .footer-app-save,html.dar-android-native-app .footer-action-save{display:none!important}html.dar-android-native-app .top-shell,html.dar-android-native-app .header,html.dar-android-native-app .header.theme-hero-surface,html.dar-android-native-app .sf-top,html.dar-android-native-app .qov-header,html.dar-android-native-app .app-bar,html.dar-android-native-app .view-head,html.dar-android-native-app .settings-page-head{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;background:var(--quran-page-bg,var(--theme-feed-bg,var(--dar-edge-fill,var(--page-cover,var(--outer-bg-flat,var(--bg,#050706))))))!important;background-image:none!important}html.dar-android-native-app .top-edge-fade,html.dar-android-native-app #topEdgeFade,html.dar-android-native-app .top-swim-aura,html.dar-android-native-app #topSwimAura{display:none!important;visibility:hidden!important;opacity:0!important;height:0!important;background:none!important;filter:none!important;pointer-events:none!important}html.dar-android-native-app .top-shell:before,html.dar-android-native-app .top-shell:after,html.dar-android-native-app .header:before,html.dar-android-native-app .header:after,html.dar-android-native-app .qov-header:before,html.dar-android-native-app .qov-header:after,html.dar-android-native-app .app-bar:before,html.dar-android-native-app .app-bar:after{content:none!important;display:none!important;opacity:0!important;background:none!important;filter:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}";
                document.documentElement.appendChild(hideSave);
                window.dispatchEvent(new Event("darAndroidBridgeUpdated"));
              }catch(e){}
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun jsString(value: String): String =
        JSONObject.quote(value)

    private inner class DarJsBridge {
        @JavascriptInterface
        fun pushSettings(json: String) {
            DarPush.applyWebSettings(json)
        }

        @JavascriptInterface
        fun haptic() {
            webView.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP)
        }
    }

    private inner class DarWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            if (DarShell.shouldOpenExternally(uri) || !DarShell.isOwnHost(uri)) {
                openExternal(uri)
                return true
            }
            return false
        }

        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            errorOverlay.visibility = View.GONE
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            injectBridge()
        }

        override fun onReceivedError(
            view: WebView,
            request: WebResourceRequest,
            error: WebResourceError
        ) {
            if (request.isForMainFrame) {
                errorOverlay.visibility = View.VISIBLE
            }
        }
    }

    private inner class DarChromeClient : WebChromeClient() {
        override fun onCreateWindow(
            view: WebView?,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message?
        ): Boolean {
            val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
            val temp = WebView(this@MainActivity)
            temp.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                    val uri = request.url
                    if (DarShell.isOwnHost(uri)) {
                        webView.loadUrl(DarShell.inAppUrl(uri))
                    } else {
                        openExternal(uri)
                    }
                    return true
                }
            }
            transport.webView = temp
            resultMsg.sendToTarget()
            return true
        }

        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            this@MainActivity.filePathCallback?.onReceiveValue(null)
            this@MainActivity.filePathCallback = filePathCallback
            val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "*/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            return try {
                fileChooser.launch(intent)
                true
            } catch (_: ActivityNotFoundException) {
                this@MainActivity.filePathCallback = null
                false
            }
        }

        override fun onGeolocationPermissionsShowPrompt(
            origin: String?,
            callback: GeolocationPermissions.Callback?
        ) {
            if (origin == null || callback == null) return
            // WebView permission is NOT an Android runtime location permission.
            // Only our app origin may request it; ask the user when required.
            if (!DarShell.isOwnHost(Uri.parse(origin))) {
                callback.invoke(origin, false, false)
                return
            }
            val allowed = listOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ).any { ContextCompat.checkSelfPermission(this@MainActivity, it) == PackageManager.PERMISSION_GRANTED }
            if (allowed) {
                callback.invoke(origin, true, false)
                return
            }
            pendingGeoOrigin?.let { oldOrigin ->
                pendingGeoCallback?.invoke(oldOrigin, false, false)
            }
            pendingGeoOrigin = origin
            pendingGeoCallback = callback
            locationPermission.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        }

        override fun onPermissionRequest(request: PermissionRequest?) {
            if (request == null) return
            runOnUiThread {
                // Never grant all website-requested WebView resources implicitly.
                if (!DarShell.isOwnHost(request.origin) ||
                    request.resources.any { it != PermissionRequest.RESOURCE_AUDIO_CAPTURE }
                ) {
                    request.deny()
                    return@runOnUiThread
                }
                if (ContextCompat.checkSelfPermission(
                        this@MainActivity, Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                ) {
                    request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                } else {
                    pendingMicrophoneRequest?.deny()
                    pendingMicrophoneRequest = request
                    microphonePermission.launch(Manifest.permission.RECORD_AUDIO)
                }
            }
        }
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }
}
