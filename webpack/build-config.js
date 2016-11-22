const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const vars = require('postcss-simple-vars');
const autoprefixer = require('autoprefixer');

const sharedVars = require('../src/common/style/variables');


module.exports = {
  context: path.resolve(__dirname, '..'),
  entry: [
    './dist/common',
  ],
  output: {
    path: path.join(__dirname, '../dist/public/static'),
    filename: 'bundle.[hash].js',
    publicPath: '/static/'
  },
  plugins: [
    new ExtractTextPlugin('style.[hash].css', { allChunks: true }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new AssetsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ],
  module: {
    loaders: require('./loaders-config.js')
  },
  postcss: function () {
    return [ vars({ variables: () => sharedVars }), autoprefixer ];
  },
  stats: {
    colors: true,
    chunks: false,
    children: false
  }
};
