module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo wires up the Reanimated worklets plugin itself on SDK 54,
  // so listing it here again would run the transform twice.
  return {
    presets: ["babel-preset-expo"],
  };
};
