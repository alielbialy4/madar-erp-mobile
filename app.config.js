/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com/api';
  const devHttpApi = apiUrl.startsWith('http://');

  return {
    ...config,
    android: {
      ...config.android,
      usesCleartextTraffic: devHttpApi,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: devHttpApi,
        },
      },
    },
  };
};
