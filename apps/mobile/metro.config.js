// Metro para NativeWind v4 + monorepo pnpm.
//
// Con pnpm conviene NO sobrescribir `nodeModulesPaths` (eso rompe la búsqueda
// jerárquica que sigue los symlinks de pnpm para resolver deps directas). Solo
// añadimos:
//  - watchFolders: la raíz del monorepo (para ver packages/*).
//  - extraNodeModules: mapeo de nativewind/css-interop, que el transform JSX de
//    NativeWind inyecta en TODOS los módulos (incl. expo-router) y que pnpm no
//    expone fuera de su propio árbol.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

const nativewindDir = path.dirname(
  require.resolve('nativewind/package.json', { paths: [projectRoot] }),
);
const cssInteropDir = path.dirname(
  require.resolve('react-native-css-interop/package.json', { paths: [nativewindDir] }),
);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  nativewind: nativewindDir,
  'react-native-css-interop': cssInteropDir,
};

module.exports = withNativeWind(config, { input: './global.css' });
