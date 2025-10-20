module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
