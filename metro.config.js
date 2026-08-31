const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/vanilla') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/middleware') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/shallow') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/traditional') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/traditional.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
