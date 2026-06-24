module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // No añadimos 'react-native-reanimated/plugin' a mano: babel-preset-expo
    // (SDK 50+) ya lo inyecta y lo resuelve a la versión correcta del proyecto.
  };
};
