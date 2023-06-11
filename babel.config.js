module.exports = api => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'module:metro-react-native-babel-preset'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      'react-native-reanimated/plugin',
      'nativewind/babel',
      require.resolve('expo-router/babel'),
    ],
  };
};
