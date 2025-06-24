module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
          // Add these options to improve production builds
          verbose: false,
          defaults: true,
        },
      ],
      // Add ReAnimated plugin properly
      "react-native-reanimated/plugin",
    ],
  };
};
