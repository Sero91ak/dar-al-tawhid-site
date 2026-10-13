package de.daraltawhid.testapp;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Button;
import android.widget.TextView;

/**
 * Standalone Dar Test Android shell, not the live Android visitor package.
 * No native push, JS bridge, native widgets or visitor-route rewrites.
 */
public final class TestActivity extends Activity {
    private static final String TEST_URL =
        "https://dar-al-tawhid.de/test/?env=staging&source=pwa#home";
    private static final int FILE_CHOOSER_CODE = 3014;
    private static final String SMOKE_TAG = "DarTestSmoke";
    private WebView view;
    private ValueCallback<Uri[]> fileChooser;
    private LinearLayout errorPanel;
    private int pageSerial = 0;
    private boolean loadFailed = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff071310);
        getWindow().setNavigationBarColor(0xff071310);
        view = new WebView(this);
        view.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        view.setBackgroundColor(0xff050706);
        view.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        FrameLayout shell = new FrameLayout(this);
        shell.addView(view);
        errorPanel = createErrorPanel();
        shell.addView(errorPanel, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(shell);

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true); // trusted test website
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // required for Android's system file picker
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " DarTestAndroid/3");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);

        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView browser, String url, android.graphics.Bitmap favicon) {
                pageSerial++;
                loadFailed = false;
                Log.i(SMOKE_TAG, "PAGE_STARTED");
                errorPanel.setVisibility(android.view.View.GONE);
            }

            @Override
            public void onPageFinished(WebView browser, String url) {
                final int serial = pageSerial;
                Log.i(SMOKE_TAG, "PAGE_FINISHED");
                browser.postDelayed(() -> logAppReadiness(serial), 5500);
                if (getIntent().getBooleanExtra("dar_test_smoke", false)) {
                    browser.postDelayed(() -> logTouchReadiness(serial), 8500);
                }
                // After a reasonable render window, never leave a permanently
                // blank/non-interactive WebView; present a native fallback.
                browser.postDelayed(() -> checkAppReady(serial), 17000);
            }

            @Override
            public void onReceivedError(WebView browser, WebResourceRequest req,
                                        WebResourceError error) {
                if (req.isForMainFrame()) {
                    Log.e(SMOKE_TAG, "MAIN_FRAME_NETWORK_ERROR " + error.getErrorCode());
                    showFailure();
                }
            }

            @Override
            public void onReceivedHttpError(WebView browser, WebResourceRequest req,
                                            WebResourceResponse response) {
                if (req.isForMainFrame() && response.getStatusCode() >= 400) {
                    Log.e(SMOKE_TAG, "MAIN_FRAME_HTTP_ERROR " + response.getStatusCode());
                    showFailure();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView browser, WebResourceRequest req) {
                if (!req.isForMainFrame()) return false;
                Uri target = req.getUrl();
                if (isTestUrl(target)) return false;
                openExternally(target);
                return true;
            }
        });

        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                if (msg.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                    Log.w(SMOKE_TAG, "WEB_JS_ERROR line=" + msg.lineNumber());
                }
                return super.onConsoleMessage(msg);
            }
            @Override
            public boolean onShowFileChooser(WebView browser,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooser != null) fileChooser.onReceiveValue(null);
                fileChooser = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_CODE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileChooser.onReceiveValue(null);
                    fileChooser = null;
                    return false;
                }
            }
        });
        view.setDownloadListener((url, userAgent, disposition, mime, size) -> {
            try {
                openExternally(Uri.parse(url));
            } catch (IllegalArgumentException ignored) { }
        });
        view.loadUrl(TEST_URL);
    }

    private LinearLayout createErrorPanel() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(android.view.Gravity.CENTER);
        panel.setPadding(28, 30, 28, 30);
        panel.setBackgroundColor(Color.rgb(5, 7, 6));
        panel.setVisibility(android.view.View.GONE);

        TextView heading = new TextView(this);
        heading.setText("Dar Test");
        heading.setTextSize(26);
        heading.setTypeface(null, Typeface.BOLD);
        heading.setTextColor(Color.rgb(240, 221, 181));
        heading.setGravity(android.view.Gravity.CENTER);
        panel.addView(heading);

        TextView message = new TextView(this);
        message.setText("Die Test-App konnte nicht vollständig geöffnet werden. " +
            "Bitte versuche es erneut oder öffne die Testseite im Browser.");
        message.setTextSize(15);
        message.setTextColor(Color.WHITE);
        message.setGravity(android.view.Gravity.CENTER);
        message.setPadding(0, 16, 0, 26);
        panel.addView(message);

        Button retry = new Button(this);
        retry.setText("Erneut laden");
        retry.setOnClickListener(v -> {
            loadFailed = false;
            panel.setVisibility(android.view.View.GONE);
            view.clearCache(true);
            view.loadUrl(TEST_URL);
        });
        panel.addView(retry);

        Button browser = new Button(this);
        browser.setText("Im Browser öffnen");
        browser.setOnClickListener(v ->
            openExternally(Uri.parse("https://dar-al-tawhid.de/test/#home")));
        panel.addView(browser);
        return panel;
    }

    private void showFailure() {
        Log.e(SMOKE_TAG, "NATIVE_FALLBACK_VISIBLE");
        loadFailed = true;
        if (errorPanel != null) errorPanel.setVisibility(android.view.View.VISIBLE);
    }

    private static final String READINESS_SCRIPT =
        "(function(){try{" +
        "var v=document.getElementById('appView');" +
        "var n=document.getElementById('bottomNav');" +
        "var t=v&&v.textContent?v.textContent.trim():'';" +
        "var blocked=!!document.querySelector('#dar-soft-boot:not(.is-done)');" +
        "return !!(v&&n&&t.length>25&&!blocked);" +
        "}catch(e){return false}})()";

    private void logAppReadiness(int serial) {
        if (view == null || pageSerial != serial || loadFailed) return;
        view.evaluateJavascript(READINESS_SCRIPT, result -> {
            if (pageSerial == serial)
                Log.i(SMOKE_TAG, "WEB_READY=" + result);
        });
    }

    // Emulator-only hit testing: prove that the actual bottom navigation
    // receives touches instead of being covered by an invisible loader.
    private void logTouchReadiness(int serial) {
        if (view == null || loadFailed || pageSerial != serial) return;
        view.evaluateJavascript(
            "(function(){try{" +
            "var bs=document.querySelectorAll('#bottomNav .bottom-nav-btn');" +
            "if(!bs.length)return false;" +
            "var b=bs[Math.min(1,bs.length-1)];" +
            "var r=b.getBoundingClientRect();" +
            "if(r.width<20||r.height<20)return false;" +
            "var el=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);" +
            "return !!(el&&(el===b||b.contains(el)));" +
            "}catch(e){return false}})()",
            result -> {
                if (pageSerial == serial)
                    Log.i(SMOKE_TAG, "TAP_TARGET_CLEAR=" + result);
            });
    }

    private void checkAppReady(int serial) {
        if (view == null || loadFailed || pageSerial != serial) return;
        view.evaluateJavascript(READINESS_SCRIPT, result -> {
            if (pageSerial != serial || loadFailed) return;
            Log.i(SMOKE_TAG, "FINAL_WEB_READY=" + result);
            if (!"true".equals(result)) showFailure();
        });
    }

    private static boolean isTestUrl(Uri target) {
        if (target == null || !"https".equalsIgnoreCase(target.getScheme())) return false;
        String host = target.getHost();
        if (host == null || (!host.equalsIgnoreCase("dar-al-tawhid.de")
                && !host.equalsIgnoreCase("www.dar-al-tawhid.de"))) return false;
        String path = target.getPath();
        return "/test".equals(path) || (path != null && path.startsWith("/test/"));
    }

    private void openExternally(Uri target) {
        if (target == null) return;
        String scheme = target.getScheme();
        if (scheme == null) return;
        if (!("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)
                || "mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, target));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "Keine passende App gefunden", Toast.LENGTH_SHORT).show();
        }
    }

    @Override @Deprecated
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_CODE && fileChooser != null) {
            fileChooser.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileChooser = null;
        }
    }

    @Override
    public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        // Android WebView keeps state while phone/fold posture changes.
        view.requestLayout();
        // WebView recalculates CSS viewport automatically. Notify JS once after
        // the native layout change and once after fold/rotation settles.
        view.postDelayed(this::notifyViewport, 140);
        view.postDelayed(this::notifyViewport, 440);
    }

    private void notifyViewport() {
        if (view == null) return;
        view.evaluateJavascript(
            "window.dispatchEvent(new Event('resize'));" +
            "window.dispatchEvent(new Event('orientationchange'));", null);
    }

    @Override @Deprecated
    public void onBackPressed() {
        if (view != null && view.canGoBack()) {
            view.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (fileChooser != null) {
            fileChooser.onReceiveValue(null);
            fileChooser = null;
        }
        if (view != null) {
            view.destroy();
            view = null;
        }
        super.onDestroy();
    }
}
