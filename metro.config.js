const { getDefaultConfig } = require("expo/metro-config");


module.exports = (() => {
  const config = getDefaultConfig(__dirname);


  const { transformer, resolver } = config;


  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-sass-transformer")
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "scss", "sass", "svg", "cjs"],
    unstable_enablePackageExports: false
  };


  return config;
})();
