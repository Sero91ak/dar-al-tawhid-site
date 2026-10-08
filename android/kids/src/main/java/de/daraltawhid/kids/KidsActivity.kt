package de.daraltawhid.kids

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Separate, privacy-minimal Android shell for TAWḤĪD KIDS.
 *
 * Deliberately NO Android ID, location, OneSignal, analytics or advertising SDK.
 * The website is the content source. External top-level navigation is blocked.
 */
class KidsActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var errorView: LinearLayout

    companion object {
        private const val HOME_URL = "https://dar-al-tawhid.de/kids/start"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val frame = FrameLayout(this).apply {
            setBackgroundColor(Color.rgb(18, 40, 56))
        }
        webView = WebView(this).apply {
            setBackgroundColor(Color.rgb(18, 40, 56))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                setSupportMultipleWindows(false)
                setGeolocationEnabled(false)
                userAgentString = "$userAgentString DarAlTawhidKidsAndroid/1.0"
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (!request.isForMainFrame) return false
                    val uri = request.url
                    val ownHost = uri.scheme.equals("https", true) &&
                        (uri.host.equals("dar-al-tawhid.de", true) ||
                         uri.host.equals("www.dar-al-tawhid.de", true))
                    val kidsPath = uri.path == "/kids" || uri.path?.startsWith("/kids/") == true
                    if (ownHost && kidsPath) return false
                    Toast.makeText(this@KidsActivity, R.string.external_blocked, Toast.LENGTH_SHORT).show()
                    return true
                }

                override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                    errorView.visibility = View.GONE
                }

                override fun onReceivedError(
                    view: WebView,
                    request: WebResourceRequest,
                    error: WebResourceError
                ) {
                    if (request.isForMainFrame) errorView.visibility = View.VISIBLE
                }
            }
        }

        errorView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            visibility = View.GONE
            setBackgroundColor(Color.rgb(18, 40, 56))
            setPadding(dp(24), dp(24), dp(24), dp(24))
            addView(TextView(this@KidsActivity).apply {
                text = getString(R.string.offline_title)
                textSize = 24f
                gravity = Gravity.CENTER
                setTextColor(Color.rgb(229, 199, 120))
            })
            addView(TextView(this@KidsActivity).apply {
                text = getString(R.string.offline_text)
                textSize = 16f
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
            })
            addView(Button(this@KidsActivity).apply {
                text = getString(R.string.retry)
                setOnClickListener {
                    errorView.visibility = View.GONE
                    webView.loadUrl(HOME_URL)
                }
            })
        }

        frame.addView(webView, FrameLayout.LayoutParams(-1, -1))
        frame.addView(errorView, FrameLayout.LayoutParams(-1, -1))
        ViewCompat.setOnApplyWindowInsetsListener(frame) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            frame.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        setContentView(frame)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
        webView.loadUrl(HOME_URL)
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
