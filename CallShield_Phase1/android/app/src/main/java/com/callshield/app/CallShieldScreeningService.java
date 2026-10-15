package com.callshield.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.telecom.Call;
import android.telecom.CallScreeningService;
import android.telecom.Connection;
import android.telephony.PhoneNumberUtils;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * User-approved incoming-call screening. It never records call audio and only asks the
 * CallShield API about the caller number while the user has enabled this Android role.
 */
public final class CallShieldScreeningService extends CallScreeningService {
    private static final String API = "https://callshield-phase1-api.vercel.app/v1/numbers/";
    private static final String PREFS = "callshield_screening";
    private static final long HIGH_RISK_CACHE_MS = 7L * 24 * 60 * 60 * 1000;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    @Override public void onScreenCall(final Call.Details details) {
        if (Build.VERSION.SDK_INT >= 29
                && details.getCallDirection() != Call.Details.DIRECTION_INCOMING) {
            return;
        }

        final String number = normalise(details.getHandle());
        if (number == null) {
            allow(details, "Caller number unavailable");
            return;
        }

        final SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (prefs.getBoolean("trusted_" + number, false)) {
            allow(details, "Trusted by you");
            return;
        }
        if (prefs.getBoolean("blocked_" + number, false)) {
            block(details, "Blocked by you");
            return;
        }
        if (isCachedHighRisk(prefs, number)) {
            respondToHighRisk(details, prefs, "Recent CallShield warning");
            return;
        }

        // Android requires a response promptly. Network lookup is bounded and unknown callers
        // are allowed when it cannot complete, avoiding delayed or falsely blocked calls.
        worker.execute(new Runnable() {
            @Override public void run() {
                try {
                    JSONObject intelligence = lookup(number);
                    boolean trusted = intelligence.optBoolean("trusted", false);
                    boolean blocked = intelligence.optBoolean("blocked", false);
                    String status = intelligence.optString("status", "UNKNOWN");
                    if (trusted) {
                        prefs.edit().putBoolean("trusted_" + number, true).apply();
                        allow(details, "Trusted CallShield number");
                    } else if (blocked) {
                        prefs.edit().putBoolean("blocked_" + number, true).apply();
                        block(details, "CallShield blocklist");
                    } else if ("HIGH_RISK".equals(status) || "DANGEROUS".equals(status)) {
                        prefs.edit().putLong("high_risk_" + number, System.currentTimeMillis()).apply();
                        respondToHighRisk(details, prefs, "High-risk CallShield intelligence");
                    } else {
                        allow(details, "No high-confidence scam signal");
                    }
                } catch (Exception ignored) {
                    if (hasFailedVerification(details)) {
                        silence(details, "Caller verification failed");
                    } else {
                        allow(details, "Intelligence unavailable");
                    }
                }
            }
        });
    }

    private JSONObject lookup(String number) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(API + Uri.encode(number)).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(1200);
        connection.setReadTimeout(2200);
        connection.setRequestProperty("Accept", "application/json");
        try {
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) throw new IllegalStateException("Lookup failed");
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"));
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) body.append(line);
            reader.close();
            return new JSONObject(body.toString());
        } finally {
            connection.disconnect();
        }
    }

    private static String normalise(Uri handle) {
        if (handle == null || handle.getSchemeSpecificPart() == null) return null;
        String raw = handle.getSchemeSpecificPart();
        String e164 = PhoneNumberUtils.formatNumberToE164(raw, "IN");
        if (e164 != null) return e164;
        String digits = raw.replaceAll("[^0-9+]", "");
        return digits.length() >= 7 ? digits : null;
    }

    private static boolean isCachedHighRisk(SharedPreferences prefs, String number) {
        long detectedAt = prefs.getLong("high_risk_" + number, 0);
        return detectedAt > 0 && System.currentTimeMillis() - detectedAt < HIGH_RISK_CACHE_MS;
    }

    private static boolean hasFailedVerification(Call.Details details) {
        return Build.VERSION.SDK_INT >= 29
            && details.getCallerNumberVerificationStatus() == Connection.VERIFICATION_STATUS_FAILED;
    }

    private void respondToHighRisk(Call.Details details, SharedPreferences prefs, String reason) {
        boolean autoBlock = prefs.getBoolean("auto_block_high_risk", false);
        if (autoBlock) block(details, reason);
        else silence(details, reason);
        notifyUser(autoBlock ? "Blocked a high-risk call" : "Silenced a high-risk call", reason);
    }

    private void allow(Call.Details details, String reason) { respond(details, false, false, false, reason); }
    private void silence(Call.Details details, String reason) { respond(details, false, false, true, reason); }
    private void block(Call.Details details, String reason) { respond(details, true, true, false, reason); }

    private void respond(Call.Details details, boolean disallow, boolean reject, boolean silence, String reason) {
        try {
            CallResponse response = new CallResponse.Builder()
                .setDisallowCall(disallow)
                .setRejectCall(reject)
                .setSilenceCall(silence)
                .setSkipCallLog(false)
                .setSkipNotification(false)
                .build();
            getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("last_screening", reason)
                .putLong("last_screening_at", System.currentTimeMillis())
                .apply();
            respondToCall(details, response);
        } catch (IllegalStateException ignored) {
            // The telecom framework may have timed out; do not attempt a second response.
        }
    }

    private void notifyUser(String title, String detail) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        final String channel = "callshield_protection";
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(new NotificationChannel(channel, "Call protection", NotificationManager.IMPORTANCE_HIGH));
        }
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, channel)
            : new Notification.Builder(this);
        manager.notify(401, builder.setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText("CallShield: " + detail)
            .setAutoCancel(true)
            .build());
    }
}
