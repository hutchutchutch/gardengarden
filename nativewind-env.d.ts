/// <reference types="nativewind/types" />

declare module "nativewind" {
    interface NativeWindConfig {
      experimental: {
        // Disable Reanimated integration
        useReanimated: false;
      };
    }
  } 