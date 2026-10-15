# CallShield Android — Phase 1 Native Call Protection

This Android app combines the hosted CallShield dashboard with a native Android
`CallScreeningService`. On Android 10 or later, the person using the phone can choose
CallShield as their call-screening app. Incoming caller numbers are then checked against
CallShield intelligence before the phone rings.

The app never records calls or uses the caller's camera, location, identity, or device
identifiers. While protection is enabled, it sends only the incoming caller number to the
CallShield API. A locally trusted number is allowed; a locally blocked or server-blocklisted
number is rejected; a high-risk number is silenced by default and can be auto-blocked only
when the user turns on that option. Unknown calls are allowed if the network is unavailable.

## Build

Requires JDK 17, Android SDK platform 35 and build-tools 35.0.0.

```sh
ANDROID_SDK_ROOT=/path/to/android-sdk JAVA_HOME=/path/to/jdk17 ./build-apk.sh
```

Output: `build/CallShield-1.2.2.apk`. The script creates and reuses a local testing key
in `build/keys/testing.jks`. Preserve that key for compatible updates to this test APK.
Build files and the key are excluded from Git. Use a dedicated release signing identity
before distributing through an app store.

The app permits HTTPS first-party navigation, opens external HTTP(S) links in the browser,
disables file/content access and mixed content, and exposes no JavaScript native bridge.
It requests internet access and declares Android's call-screening service, which becomes active
only after the person using the device grants the system call-screening role. Connection failures
allow unknown calls rather than delaying or blocking them.

## Verification

Compiled against Android API 35. APK v2/v3 signature verification and package metadata
checks pass. Hosted API health verified. Device/emulator runtime testing is still needed.

## Current limits and next phase

Android's role gives CallShield the dialled/incoming number and call-verification status; it does
not reveal a scammer's real location, camera, IMEI, call audio, or identity. Telecom providers and
authorities are required for attribution. The next product phase is consent-based local call history,
per-user blocklist synchronisation, and a native warning screen for silenced calls.
