module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // babel-preset-expo auto-injects `react-native-reanimated/plugin`
          // whenever reanimated is installed. In this install that plugin
          // fails to resolve `react-native-worklets/plugin`, which broke the
          // web build outright. No app code authors worklets, so the plugin
          // buys us nothing — turn the auto-injection off. Re-enable if
          // worklet-based animation is introduced.
          reanimated: false,
        },
      ],
      'nativewind/babel',
    ],
    plugins: [],
  };
};
