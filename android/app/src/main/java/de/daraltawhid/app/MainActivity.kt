package de.daraltawhid.app

import android.annotation.SuppressLint
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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var errorOverlay: LinearLayout
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingUrl: String = DarShell.LIVE_URL

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
                window.DAR_ANDROID_NATIVE_APP=true;
                window.DAR_ANDROID_NATIVE_PUSH=true;
                window.DAR_IOS_NATIVE_APP=false;
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
                hideSave.textContent="html.dar-android-native-app #footerAppSave,html.dar-android-native-app .footer-app-save,html.dar-android-native-app .footer-action-save{display:none!important}";
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
            callback?.invoke(origin, true, false)
        }

        override fun onPermissionRequest(request: PermissionRequest?) {
            request?.grant(request.resources)
        }
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }
}
