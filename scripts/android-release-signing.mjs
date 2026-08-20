import fs from 'node:fs';
import path from 'node:path';

const gradlePath = process.argv[2];
if (!gradlePath) {
  console.error('Usage: node android-release-signing.mjs <android/app/build.gradle>');
  process.exit(1);
}

const contents = fs.readFileSync(gradlePath, 'utf8');
const patched = patchAppBuildGradle(contents);
fs.writeFileSync(gradlePath, patched);
console.log(`Patched release signing: ${path.relative(process.cwd(), gradlePath)}`);

function patchAppBuildGradle(source) {
  if (!source.includes('import java.io.FileInputStream')) {
    source = `import java.io.FileInputStream\n${source}`;
  }

  if (!source.includes('Madar Play release signing')) {
    if (!/signingConfigs\s*\{/.test(source)) {
      throw new Error('No signingConfigs block found');
    }
    source = source.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        // Madar Play release signing
        release {
            def ksFile = rootProject.file("keystore.properties")
            if (!ksFile.exists()) {
                throw new GradleException("Missing android/keystore.properties. Run npm run android:play:bundle")
            }
            def ks = new Properties()
            ks.load(new FileInputStream(ksFile))
            keyAlias ks['keyAlias']
            keyPassword ks['keyPassword']
            storeFile file(ks['storeFile'])
            storePassword ks['storePassword']
        }`,
    );
  }

  if (!source.includes('nodeExecutableAndArgs = ["node", "--max-old-space-size=8192"]')) {
    source = source.replace(
      'enableBundleCompression = (findProperty(\'android.enableBundleCompression\') ?: false).toBoolean()',
      `enableBundleCompression = (findProperty('android.enableBundleCompression') ?: false).toBoolean()
    nodeExecutableAndArgs = ["node", "--max-old-space-size=8192"]`,
    );
  }

  source = source.replace(
    /(buildTypes\s*\{[\s\S]*?\n\s*release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
    '$1signingConfig signingConfigs.release',
  );

  if (!/buildTypes\s*\{[\s\S]*\n\s*release\s*\{[\s\S]*signingConfig\s+signingConfigs\.release/.test(source)) {
    throw new Error('Could not switch the release buildType to signingConfigs.release');
  }

  return source;
}
