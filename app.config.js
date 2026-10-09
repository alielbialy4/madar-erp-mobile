/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  const pluginNames = () =>
    plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));

  for (const plugin of [
    'expo-localization',
    'expo-image',
    'expo-secure-store',
    'expo-sharing',
    'expo-status-bar',
  ]) {
    if (!pluginNames().includes(plugin)) {
      plugins.push(plugin);
    }
  }

  if (!pluginNames().includes('expo-build-properties')) {
    plugins.push([
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
        ios: {
          enableSceneSupport: true,
        },
      },
    ]);
  }

  if (!pluginNames().includes('expo-splash-screen')) {
    plugins.push([
      'expo-splash-screen',
      {
        backgroundColor: '#0F172A',
        image: './assets/splash.png',
        imageWidth: 280,
        resizeMode: 'contain',
      },
    ]);
  }

  return {
    ...config,
    plugins,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
  };
};
