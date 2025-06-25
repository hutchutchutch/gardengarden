const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable problematic serializer plugins that cause compatibility issues
config.serializer = {
  ...config.serializer,
  customSerializer: undefined,
};

module.exports = withNativeWind(config, { input: './global.css' }); 