/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  void raw;
  const plugins = [...(config.plugins ?? [])];
  if (!plugins.includes('expo-localization')) {
    plugins.push('expo-localization');
  }

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      usesCleartextTraffic: true,
    },
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
