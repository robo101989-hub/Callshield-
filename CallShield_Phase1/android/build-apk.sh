#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_SDK_ROOT:?Set ANDROID_SDK_ROOT to your Android SDK}"
: "${JAVA_HOME:?Set JAVA_HOME to a JDK 17 or newer}"
TOOLS="$ANDROID_SDK_ROOT/build-tools/35.0.0"
PLATFORM="$ANDROID_SDK_ROOT/platforms/android-35/android.jar"
export PATH="$JAVA_HOME/bin:$PATH"
mkdir -p build/classes build/dex build/keys
"$TOOLS/aapt2" compile --dir app/src/main/res -o build/resources.zip
"$TOOLS/aapt2" link -o build/base.apk -I "$PLATFORM" --manifest app/src/main/AndroidManifest.xml build/resources.zip
javac -source 8 -target 8 -bootclasspath "$PLATFORM" -d build/classes app/src/main/java/com/callshield/app/MainActivity.java
find build/classes -name '*.class' -print > build/classes.list
"$TOOLS/d8" --lib "$PLATFORM" --min-api 26 --output build/dex @build/classes.list
cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q -u ../unsigned.apk classes.dex)
"$TOOLS/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
# Local testing key: intentionally not a Play Store release signing identity.
if [ ! -f build/keys/testing.jks ]; then
    keytool -genkeypair -keystore build/keys/testing.jks -storepass android -keypass android -alias callshield-test -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=CallShield Testing' >/dev/null 2>&1
fi
"$TOOLS/apksigner" sign --ks build/keys/testing.jks --ks-key-alias callshield-test --ks-pass pass:android --key-pass pass:android --out build/CallShield-1.2.2.apk build/aligned.apk
"$TOOLS/apksigner" verify --verbose build/CallShield-1.2.2.apk
"$TOOLS/aapt2" dump badging build/CallShield-1.2.2.apk
