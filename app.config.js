/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const raw = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  const apiUrl =
    raw && !raw.includes('your-api-domain.com')
      ? raw.replace(/\/+$/, '').endsWith('/api')
        ? raw.replace(/\/+$/, '')
        : `${raw.replace(/\/+$/, '')}/api`
      : 'http://back.test/api';
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
