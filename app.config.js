/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  void raw;
  return {
    ...config,
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
