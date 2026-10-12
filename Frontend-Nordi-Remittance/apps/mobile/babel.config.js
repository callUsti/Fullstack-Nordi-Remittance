module.exports = function (api) {
  api.cache(true);

  const config = {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@app': './app',
            '@assets': './assets',
            '@components': './components',
            '@constants': './constants',
            '@core': './core',
            '@hooks': './hooks',
            '@utils': './core/utils',
            '@store': './store',
            '@types': './types',
          },
          extensions: ['.ios.ts', '.ios.tsx', '.android.ts', '.android.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };

  // Strip all console.* calls in production / preview builds
  if (process.env.NODE_ENV === "production" || process.env.BABEL_ENV === "production") {
    config.plugins = [
      ...(config.plugins || []),
      "transform-remove-console",
    ];
  }

  config.plugins.push('react-native-worklets/plugin');

  return config;
};
