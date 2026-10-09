package de.daraltawhid.app

import android.annotation.SuppressLint
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.content.ActivityNotFoundException
import android.content.Intent
import android.provider.Settings
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
import android.widget.Toast
import android.widget.Button
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var errorOverlay: LinearLayout
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingUrl: String = DarShell.LIVE_URL
    private var pendingGeolocation: Pair<String, GeolocationPermissions.Callback>? = null

    private val locationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val pending = pendingGeolocation
        pendingGeolocation = null
        val granted = results[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            results[Manifest.permission.ACCESS_COARSE_LOCATION] == true ||
            hasDeviceLocationPermission()
        if (pending != null) pending.second.invoke(pending.first, granted, false)
    }

    private fun hasDeviceLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

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
        webView.addJavascriptInterface(DarJsBridge(), "DarNative")
        // Mark the genuine Android shell before any page script runs.
        // onPageFinished is too late: the site may have already chosen iOS UI.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                """
                (function(){
                    window.DAR_PLATFORM="android";
                    window.DAR_NATIVE_PLATFORM="android";
                    window.DAR_ANDROID_NATIVE_APP=true;
                    window.DAR_ANDROID_ALTERNATE_ICONS_AVAILABLE=true;
                    // The shared site's OneSignal initialization historically
                    // sets DAR_IOS_NATIVE_APP=true for *both* native platforms.
                    // Pin this Android-only property before that script runs.
                    Object.defineProperty(window,"DAR_IOS_NATIVE_APP",{
                      configurable:false, enumerable:true,
                      get:function(){return false;},
                      set:function(){}
                    });
                    Object.defineProperty(window,"DAR_OFFICIAL_IOS_APP",{
                      configurable:false, enumerable:true,
                      get:function(){return false;},
                      set:function(){}
                    });
                    if(document.documentElement){
                      document.documentElement.classList.add("dar-android-native-app","is-android");
                    }else{
                      document.addEventListener("DOMContentLoaded",function(){
                        if(document.documentElement)document.documentElement.classList.add("dar-android-native-app","is-android");
                      },{once:true});
                    }
                    try {
                      if(!window.webkit) window.webkit={};
                      if(!window.webkit.messageHandlers) window.webkit.messageHandlers={};
                      window.webkit.messageHandlers.darAppIcon={
                        postMessage:function(payload){
                          var selected=typeof payload==="string"?payload:
                            payload&&typeof payload==="object"?(payload.name||payload.id||""):"";
                          DarNative.setAppIcon(String(selected));
                        }
                      };
                      window.DAR_ANDROID_SELECT_APP_ICON=function(name){
                        DarNative.setAppIcon(String(name||"default"));
                      };
                      window.webkit.messageHandlers.darOpenSystemSettings={
                        postMessage:function(data){
                          DarNative.openSystemSettings(
                            String(data&&data.kind?data.kind:"app")
                          );
                        }
                      };
                    } catch(e) {}
                })();
                """.trimIndent(),
                setOf("https://dar-al-tawhid.de", "https://www.dar-al-tawhid.de")
            )
        }
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
        pendingGeolocation?.let { it.second.invoke(it.first, false, false) }
        pendingGeolocation = null
        webView.destroy()
        super.onDestroy()
    }

    private fun injectBridge() {
        val device = DarPush.deviceId(this)
        val sub = DarPush.subscriptionId()
        val token = DarPush.pushToken()
        val js = """
            (function(){
              try{
                window.DAR_PLATFORM="android";
                window.DAR_NATIVE_PLATFORM="android";
                window.DAR_ANDROID_NATIVE_APP=true;
                window.DAR_ANDROID_ALTERNATE_ICONS_AVAILABLE=true;
                window.DAR_OFFICIAL_IOS_APP=false;
                window.DAR_IOS_NATIVE_APP=false;
                // Same in-app picker message format as the existing iOS app.
                // Only route app-icon events; never alter the push bridge.
                try {
                  if(!window.webkit) window.webkit={};
                  if(!window.webkit.messageHandlers) window.webkit.messageHandlers={};
                  window.webkit.messageHandlers.darAppIcon={
                    postMessage:function(payload){
                      try {
                        var chosen=typeof payload==="string"?payload:
                          payload&&typeof payload==="object"?(payload.name||payload.id||""):"";
                        DarNative.setAppIcon(String(chosen));
                      }catch(iconError){}
                    }
                  };
                  window.DAR_ANDROID_SELECT_APP_ICON=function(name){
                    try{DarNative.setAppIcon(String(name||"default"))}catch(e){}
                  };
                  window.webkit.messageHandlers.darOpenSystemSettings={
                    postMessage:function(data){
                      try{DarNative.openSystemSettings(String(data&&data.kind?data.kind:"app"))}catch(e){}
                    }
                  };
                }catch(e){}

                window.DAR_ANDROID_NATIVE_PUSH=true;
                window.DAR_IOS_NATIVE_APP=false;
                window.DAR_ANDROID_DEVICE_ID=${jsString(device)};
                window.DAR_ANDROID_ONESIGNAL_ID=${jsString(sub)};
                window.DAR_ANDROID_PUSH_TOKEN=${jsString(token)};
                try{localStorage.setItem("darPushExternalIdV1", window.DAR_ANDROID_DEVICE_ID)}catch(e){}
                // Native home-screen widget location bridge. The website may
                // change the selected city without a full page reload.
                // Sync the saved coordinates only when changed, no extra GPS
                // requests and no OneSignal/push registration side effects.
                try{
                  if(!window.__DAR_ANDROID_WIDGET_SYNC_V2){
                    window.__DAR_ANDROID_WIDGET_SYNC_V2=true;
                    window.__darWidgetLastLocation=null;
                    window.__darAndroidSyncWidgetLocation=function(){
                      try{
                        var value=typeof getPrayerSettings==="function"?
                          getPrayerSettings():JSON.parse(localStorage.getItem("darPrayerSettingsV1")||"{}");
                        var lat=Number(value.lat!=null?value.lat:value.latitude);
                        var lon=Number(value.lon!=null?value.lon:value.lng!=null?value.lng:value.longitude);
                        if(!Number.isFinite(lat)||!Number.isFinite(lon)||
                           lat< -90||lat>90||lon< -180||lon>180||
                           !(value.locationGranted===true||value.city||value.locationName))return;
                        var name=String(value.city||value.locationName||"Mein Standort").slice(0,60);
                        var signature=lat.toFixed(5)+"|"+lon.toFixed(5)+"|"+name;
                        if(signature===window.__darWidgetLastLocation)return;
                        DarNative.saveWidgetLocation(lat,lon,name);
                        window.__darWidgetLastLocation=signature;
                      }catch(e){}
                    };
                    window.__darAndroidSyncWidgetLocation();
                    window.setInterval(window.__darAndroidSyncWidgetLocation,60000);
                  }else if(window.__darAndroidSyncWidgetLocation){
                    window.__darAndroidSyncWidgetLocation();
                  }
                }catch(e){}
                var root=document.documentElement;
                if(root){
                  root.classList.remove("dar-ios-native-app","dar-ios-native-tabs");
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
              }catch(e){}
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun jsString(value: String): String =
        JSONObject.quote(value)

    private inner class DarJsBridge {
        @JavascriptInterface
        fun setAppIcon(name: String) {
            DarAppIcons.set(this@MainActivity, name)
        }

        @JavascriptInterface
        fun getAppIcon(): String = DarAppIcons.current(this@MainActivity)

        @JavascriptInterface
        fun saveWidgetLocation(latitude: Double, longitude: Double, city: String) {
            DarPrayerWidgetProvider.saveLocation(
                this@MainActivity.applicationContext, latitude, longitude, city
            )
        }

        @JavascriptInterface
        fun openSystemSettings(kind: String) {
            runOnUiThread {
                val which = kind.trim().lowercase()
                // Android settings UIs differ by vendor. App details always works
                // and links directly to location and notification permissions.
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    startActivity(intent)
                    if (which == "location") {
                        Toast.makeText(this@MainActivity,
                            "Unter Berechtigungen → Standort den Zugriff erlauben.",
                            Toast.LENGTH_LONG).show()
                    } else if (which == "notifications") {
                        Toast.makeText(this@MainActivity,
                            "Unter Benachrichtigungen die gewünschten Hinweise erlauben.",
                            Toast.LENGTH_LONG).show()
                    }
                } catch (_: ActivityNotFoundException) {
                    Toast.makeText(this@MainActivity,
                        "Bitte die App-Berechtigungen in den Android-Einstellungen öffnen.",
                        Toast.LENGTH_LONG).show()
                }
            }
        }

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
            // Only our production origin may request the device's location.
            if (!DarShell.isOwnHost(Uri.parse(origin)) || !origin.startsWith("https://")) {
                callback.invoke(origin, false, false)
                return
            }
            if (hasDeviceLocationPermission()) {
                callback.invoke(origin, true, false)
                return
            }
            // Never lie to the WebView: native runtime permission must be granted.
            pendingGeolocation?.let { old -> old.second.invoke(old.first, false, false) }
            pendingGeolocation = origin to callback
            locationPermission.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        }

        override fun onPermissionRequest(request: PermissionRequest?) {
            // Geolocation is handled by its own runtime-permission callback.
            // Never blindly grant camera/microphone/protected-media permissions
            // merely because a web page requested them.
            request?.deny()
        }
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }
}
