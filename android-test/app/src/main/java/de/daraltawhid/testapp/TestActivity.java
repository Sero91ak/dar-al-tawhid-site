package de.daraltawhid.testapp;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Standalone Dar Test Android shell, not the live Android visitor package.
 * No native push, JS bridge, native widgets or visitor-route rewrites.
 */
public final class TestActivity extends Activity {
    private static final String TEST_URL =
        "https://dar-al-tawhid.de/test/?env=staging&source=android-test-apk#home";
    private static final int FILE_CHOOSER_CODE = 3014;
    private WebView view;
    private ValueCallback<Uri[]> fileChooser;

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
        setContentView(view);

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
        settings.setUserAgentString(settings.getUserAgentString() + " DarTestAndroid/1");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);

        view.setWebViewClient(new WebViewClient() {
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
        notifyViewport();
        view.postDelayed(this::notifyViewport, 180);
        view.postDelayed(this::notifyViewport, 520);
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
