package com.firefame.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    public static final String CHANNEL_ID = "fire_zone_default";
    private static final int NOTIF_PERMISSION_CODE = 1001;
    private static volatile String fcmToken = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createChannel();
        askNotificationPermission();

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            // Website ye bridge padhkar phone ka push token save karti hai.
            webView.addJavascriptInterface(new PushBridge(), "AndroidPush");
        }

        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (task.isSuccessful() && task.getResult() != null) {
                setToken(task.getResult());
            }
        });
        FirebaseMessaging.getInstance().subscribeToTopic("fire_zone_all");

        openUrlFromIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        openUrlFromIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        pushTokenToPage();
    }

    static void setToken(String token) {
        fcmToken = token;
    }

    private void pushTokenToPage() {
        final String token = fcmToken;
        if (token == null || getBridge() == null) return;
        final WebView webView = getBridge().getWebView();
        if (webView == null) return;
        webView.post(() -> webView.evaluateJavascript(
            "window.saveAndroidPushToken && window.saveAndroidPushToken('" + token + "')", null));
    }

    private void openUrlFromIntent(Intent intent) {
        if (intent == null || getBridge() == null) return;
        String url = intent.getStringExtra("url");
        if (url == null || !url.startsWith("https://fire-fame.lovable.app")) return;
        intent.removeExtra("url");
        final WebView webView = getBridge().getWebView();
        if (webView != null) webView.post(() -> webView.loadUrl(url));
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "FireZone Alerts", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Tournament, room aur result alerts");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIF_PERMISSION_CODE);
        }
    }

    public static class PushBridge {
        @JavascriptInterface
        public String getToken() {
            return fcmToken == null ? "" : fcmToken;
        }
    }
}
