const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock out react-native-reanimated to prevent babel from trying to load it
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native-reanimated' || moduleName === 'react-native-reanimated/plugin') {
      // Return a mock module
      return {
        filePath: __dirname + '/node_modules/react-native/Libraries/Animated/Animated.js',
        type: 'sourceFile',
      };
    }
    
    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: './global.css' }); 