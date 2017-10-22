
/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import { dependencies as externals } from './app/package.json';

export default {
  externals: Object.keys(externals || {}),
    devtool: 'source-map',

  target: 'electron-main',

  entry: './app/main.dev',

  // 'main.js' in root
  output: {
    path: __dirname,
    filename: './app/main.prod.js'
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      }
    }]
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, 'app'),
      'node_modules',
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }),

    new webpack.NamedModulesPlugin(),
  ],
};
