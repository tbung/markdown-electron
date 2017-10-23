const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const mainConfig = {
  entry: {
    main: './src/main/index.js'
  },
  target: 'electron-main',
  output: {
    path: path.join(__dirname, 'app'),
    filename: 'main.bundle.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.js', '.jsx']
  },
  plugins: [new webpack.IgnorePlugin(/\.(css|less)$/)]
};

const rendererConfig = {
  entry: {
    app: './src/renderer/index.js',
  },
  externals: [nodeExternals()],
  target: 'electron-renderer',
  output: {
    path: path.join(__dirname, 'app'),
    filename: 'renderer.bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'style-loader' // creates style nodes from JS strings
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }, {
          loader: 'less-loader' // compiles Less to CSS
        }]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    // new webpack.IgnorePlugin(/\.less$/),
    new ExtractTextPlugin('styles.css')
  ]
};

module.exports = [mainConfig, rendererConfig];
