package com.firefame.app;

import android.app.PendingIntent;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

// App khula ho ya data-only message aaye, tab bhi notification bar me alert dikhata hai.
public class FireZoneMessagingService extends FirebaseMessagingService {

    @Override
    public void onNewToken(@NonNull String token) {
        MainActivity.setToken(token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        Map<String, String> data = message.getData();
        String title = null;
        String body = null;
        if (message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        }
        if (title == null) title = data.get("title");
        if (body == null) body = data.get("message") != null ? data.get("message") : data.get("body");
        if (title == null && body == null) return;

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        String url = data.get("url");
        if (url != null) intent.putExtra("url", url);
        PendingIntent pi = PendingIntent.getActivity(
            this, (int) System.currentTimeMillis(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, MainActivity.CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title != null ? title : "FireZone")
            .setContentText(body != null ? body : "")
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body != null ? body : ""))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        try {
            NotificationManagerCompat.from(this).notify((int) System.currentTimeMillis(), b.build());
        } catch (SecurityException ignored) {
            // User ne notification permission nahi di.
        }
    }
}
