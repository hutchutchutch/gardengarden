const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable problematic serializer plugins that cause compatibility issues
config.serializer = {
  ...config.serializer,
  customSerializer: undefined,
};

module.exports = config; 