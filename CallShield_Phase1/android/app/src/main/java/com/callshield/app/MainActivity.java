package com.callshield.app;

import android.app.Activity;
import android.app.role.RoleManager;
import android.content.Context;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.webkit.*;
import android.widget.*;

/** Home for CallShield's user-approved native screening and hosted intelligence dashboard. */
public class MainActivity extends Activity {
    private static final String HOME = "https://callshield-phase1-three.vercel.app/";
    private static final int REQUEST_CALL_SCREENING = 402;
    private WebView web;
    private LinearLayout error;
    private ProgressBar progress;
    private TextView screeningStatus;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(8, 16, 32));
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
          @Override public android.view.WindowInsets onApplyWindowInsets(View v, android.view.WindowInsets insets) {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
          }
        });
        addProtectionControls(root);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        root.addView(progress, new LinearLayout.LayoutParams(-1, 6));
        error = new LinearLayout(this);
        error.setOrientation(LinearLayout.VERTICAL);
        error.setPadding(32, 64, 32, 32);
        TextView message = new TextView(this);
        message.setText("CallShield needs an internet connection. Check your connection and try again.");
        message.setTextColor(Color.WHITE);
        message.setTextSize(18);
        error.addView(message);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { error.setVisibility(View.GONE); web.setVisibility(View.VISIBLE); web.loadUrl(HOME); }
        });
        error.addView(retry);
        error.setVisibility(View.GONE);
        root.addView(error);
        web = new WebView(this);
        root.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value == 100 ? View.GONE : View.VISIBLE);
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "callshield-phase1-three.vercel.app".equals(uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (android.content.ActivityNotFoundException ignored) { }
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError failure) {
                if (request.isForMainFrame()) showError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 400) showError();
            }
        });
        if (state == null || web.restoreState(state) == null) {
            Intent incoming = getIntent();
            String shared = Intent.ACTION_SEND.equals(incoming.getAction()) && "text/plain".equals(incoming.getType())
                ? incoming.getStringExtra(Intent.EXTRA_TEXT) : null;
            web.loadUrl(shared == null ? HOME : HOME + "#check=" + Uri.encode(shared.substring(0, Math.min(shared.length(), 6000))));
        }
    }

    private void addProtectionControls(LinearLayout root) {
        final int padding = (int) (16 * getResources().getDisplayMetrics().density);
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(padding, padding, padding, padding);
        card.setBackgroundColor(Color.rgb(15, 36, 65));

        TextView heading = new TextView(this);
        heading.setText("Native call protection");
        heading.setTextColor(Color.WHITE);
        heading.setTextSize(18);
        card.addView(heading);

        screeningStatus = new TextView(this);
        screeningStatus.setTextColor(Color.rgb(196, 220, 255));
        screeningStatus.setTextSize(14);
        screeningStatus.setPadding(0, padding / 3, 0, padding / 2);
        card.addView(screeningStatus);

        Button enable = new Button(this);
        enable.setText("Enable automatic call screening");
        enable.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View view) { requestScreeningRole(); }
        });
        card.addView(enable);

        final Switch autoBlock = new Switch(this);
        autoBlock.setText("Automatically block high-confidence scam calls");
        autoBlock.setTextColor(Color.WHITE);
        autoBlock.setChecked(getSharedPreferences("callshield_screening", Context.MODE_PRIVATE)
            .getBoolean("auto_block_high_risk", false));
        autoBlock.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener() {
            @Override public void onCheckedChanged(android.widget.CompoundButton button, boolean checked) {
                getSharedPreferences("callshield_screening", Context.MODE_PRIVATE).edit()
                    .putBoolean("auto_block_high_risk", checked).apply();
            }
        });
        card.addView(autoBlock);

        TextView disclosure = new TextView(this);
        disclosure.setText("When enabled, CallShield sends only an incoming caller number to its threat-intelligence service. It does not record call audio. Unknown callers are allowed if intelligence is unavailable.");
        disclosure.setTextColor(Color.rgb(180, 200, 225));
        disclosure.setTextSize(12);
        disclosure.setPadding(0, padding / 2, 0, 0);
        card.addView(disclosure);
        root.addView(card);
        updateScreeningStatus();
    }

    private void requestScreeningRole() {
        if (Build.VERSION.SDK_INT < 29) {
            Toast.makeText(this, "Automatic screening requires Android 10 or later.", Toast.LENGTH_LONG).show();
            return;
        }
        RoleManager roles = (RoleManager) getSystemService(RoleManager.class);
        if (roles == null || !roles.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
            Toast.makeText(this, "Call screening is not available on this phone.", Toast.LENGTH_LONG).show();
            return;
        }
        if (roles.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
            updateScreeningStatus();
            return;
        }
        startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), REQUEST_CALL_SCREENING);
    }

    private void updateScreeningStatus() {
        if (screeningStatus == null) return;
        boolean enabled = false;
        if (Build.VERSION.SDK_INT >= 29) {
            RoleManager roles = (RoleManager) getSystemService(RoleManager.class);
            enabled = roles != null && roles.isRoleHeld(RoleManager.ROLE_CALL_SCREENING);
        }
        screeningStatus.setText(enabled
            ? "Protection is on. High-risk calls are silenced or blocked according to your choice."
            : "Protection is off. Enable it to check incoming callers before the phone rings.");
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CALL_SCREENING) updateScreeningStatus();
    }
    private void showError() { web.setVisibility(View.GONE); error.setVisibility(View.VISIBLE); progress.setVisibility(View.GONE); }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onResume() { super.onResume(); updateScreeningStatus(); }
    @Override protected void onSaveInstanceState(Bundle state) { web.saveState(state); super.onSaveInstanceState(state); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
