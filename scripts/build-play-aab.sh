#!/usr/bin/env bash
# Build a signed Android App Bundle (.aab) for manual Google Play Console upload.
# Does not use EAS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEYSTORE_DIR="$ROOT/credentials/android"
KEYSTORE_FILE="$KEYSTORE_DIR/upload-keystore.jks"
KEYSTORE_PROPS="$KEYSTORE_DIR/keystore.properties"
UPLOAD_CERT="$KEYSTORE_DIR/upload-certificate.pem"
OUT_DIR="$ROOT/dist/play"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-upload}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /opt/homebrew/opt/openjdk@17 ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  elif /usr/libexec/java_home >/dev/null 2>&1; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home)"
  fi
fi
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://back-madar.amen-card.com/api}"
export EXPO_PUBLIC_TIMEZONE="${EXPO_PUBLIC_TIMEZONE:-Africa/Cairo}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export GRADLE_OPTS="${GRADLE_OPTS:--Xmx4g -XX:MaxMetaspaceSize=1g}"

usage() {
  cat <<'EOF'
Usage:
  npm run android:play:keystore   # create upload keystore only
  npm run android:play:bundle              # prebuild + signed AAB
  bash scripts/build-play-aab.sh --gradle-only   # reuse android/ and rebuild AAB

Environment:
  ANDROID_HOME, JAVA_HOME
  EXPO_PUBLIC_API_URL, EXPO_PUBLIC_TIMEZONE  (loaded from .env)
  ANDROID_VERSION_CODE                       (optional override)
EOF
}

ensure_tools() {
  command -v keytool >/dev/null || { echo "keytool not found. Install JDK 17 and set JAVA_HOME."; exit 1; }
  command -v node >/dev/null || { echo "node not found."; exit 1; }
  [[ -d "$ANDROID_HOME" ]] || { echo "ANDROID_HOME not found: $ANDROID_HOME"; exit 1; }
}

ensure_hermesc() {
  local dest="$ROOT/node_modules/react-native/sdks/hermesc/osx-bin/hermesc"
  if [[ -x "$dest" ]]; then
    xattr -d com.apple.quarantine "$dest" 2>/dev/null || true
    return
  fi
  echo "Restoring missing hermesc binary..."
  local rn_version tmp
  rn_version="$(node -p "require('react-native/package.json').version")"
  tmp="$(mktemp -d)"
  (
    cd "$tmp"
    npm pack "react-native@${rn_version}" --silent
    tar -xzf "react-native-${rn_version}.tgz" package/sdks/hermesc/osx-bin/hermesc
  )
  mkdir -p "$(dirname "$dest")"
  cp "$tmp/package/sdks/hermesc/osx-bin/hermesc" "$dest"
  chmod +x "$dest"
  xattr -d com.apple.quarantine "$dest" 2>/dev/null || true
  rm -rf "$tmp"
  [[ -x "$dest" ]] || { echo "Failed to restore hermesc at $dest"; exit 1; }
}

ensure_version_code() {
  node -e "
    const fs = require('fs');
    const file = 'app.json';
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    json.expo.android = json.expo.android || {};
    const override = process.env.ANDROID_VERSION_CODE;
    if (override) {
      json.expo.android.versionCode = Number(override);
    } else if (!json.expo.android.versionCode) {
      json.expo.android.versionCode = 1;
    }
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    process.stdout.write(String(json.expo.android.versionCode));
  "
}

init_keystore() {
  mkdir -p "$KEYSTORE_DIR"
  if [[ -f "$KEYSTORE_FILE" && -f "$KEYSTORE_PROPS" ]]; then
    echo "Using existing upload keystore: $KEYSTORE_FILE"
    return
  fi
  if [[ -f "$KEYSTORE_FILE" && ! -f "$KEYSTORE_PROPS" ]]; then
    echo "Found $KEYSTORE_FILE but missing keystore.properties."
    echo "Create $KEYSTORE_PROPS with storePassword, keyPassword, keyAlias, storeFile."
    exit 1
  fi

  local password
  password="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  echo "Creating upload keystore (keep this file forever): $KEYSTORE_FILE"

  keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$password" \
    -keypass "$password" \
    -dname "CN=Madar POS, OU=Mobile, O=Madar, L=Cairo, ST=Cairo, C=EG"

  cat > "$KEYSTORE_PROPS" <<EOF
storeFile=$KEYSTORE_FILE
storePassword=$password
keyAlias=$KEY_ALIAS
keyPassword=$password
EOF
  chmod 600 "$KEYSTORE_PROPS" "$KEYSTORE_FILE"

  keytool -exportcert -rfc \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -storepass "$password" \
    -file "$UPLOAD_CERT" >/dev/null

  echo
  echo "Upload keystore created."
  echo "  keystore:     $KEYSTORE_FILE"
  echo "  passwords:    $KEYSTORE_PROPS"
  echo "  certificate:  $UPLOAD_CERT"
  echo "Back these up offline. Google Play cannot give you this private key later."
}

copy_keystore_props() {
  local android_dir="$ROOT/android"
  [[ -d "$android_dir" ]] || { echo "android/ missing after prebuild"; exit 1; }
  cp "$KEYSTORE_PROPS" "$android_dir/keystore.properties"
}

apply_play_gradle_props() {
  local props="$ROOT/android/gradle.properties"
  [[ -f "$props" ]] || { echo "Missing $props"; exit 1; }
  if grep -q '^org.gradle.jvmargs=' "$props"; then
    sed -i '' 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m/' "$props"
  else
    echo 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m' >> "$props"
  fi
  if grep -q '^reactNativeArchitectures=' "$props"; then
    sed -i '' 's/^reactNativeArchitectures=.*/reactNativeArchitectures=armeabi-v7a,arm64-v8a/' "$props"
  fi
}

build_bundle() {
  local gradle_only="${1:-}"
  ensure_tools
  init_keystore

  local version version_code aab_name
  version="$(node -p "require('./app.json').expo.version")"
  version_code="$(ensure_version_code)"
  echo "Building Play AAB  version=$version  versionCode=$version_code"
  echo "API: $EXPO_PUBLIC_API_URL"

  if [[ "$gradle_only" == "--gradle-only" ]]; then
    [[ -d "$ROOT/android" ]] || { echo "android/ is missing. Run without --gradle-only first."; exit 1; }
  else
    CI=1 npx expo prebuild --platform android --clean
  fi

  copy_keystore_props
  apply_play_gradle_props
  ensure_hermesc

  local gradle_file="$ROOT/android/app/build.gradle"
  [[ -f "$gradle_file" ]] || { echo "Missing $gradle_file"; exit 1; }
  node "$ROOT/scripts/android-release-signing.mjs" "$gradle_file"

  (
    cd "$ROOT/android"
    chmod +x ./gradlew
    ./gradlew :app:bundleRelease --no-daemon
  )

  mkdir -p "$OUT_DIR"
  local built
  built="$(find "$ROOT/android/app/build/outputs/bundle" -name '*.aab' | head -n 1)"
  [[ -n "$built" ]] || { echo "AAB not found under android/app/build/outputs/bundle"; exit 1; }

  aab_name="MadarPOS-${version}-vc${version_code}.aab"
  cp "$built" "$OUT_DIR/$aab_name"

  echo
  echo "Play upload file:"
  echo "  $OUT_DIR/$aab_name"
  echo
  echo "Upload this AAB in Google Play Console → Production (or testing track) → Create release."
  echo "Package name must stay: com.madar.erp.mobile"
}

case "${1:-}" in
  -h|--help) usage ;;
  --keystore-only) ensure_tools; init_keystore ;;
  --gradle-only) build_bundle --gradle-only ;;
  "") build_bundle ;;
  *) echo "Unknown argument: $1"; usage; exit 1 ;;
esac
