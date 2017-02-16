const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const vars = require('postcss-simple-vars');
const autoprefixer = require('autoprefixer');

const { conf } = require('../src/server/helpers/config');
const WEBPACK_DEV_URL = conf.get('WEBPACK_DEV_URL');
const sharedVars = require('../src/common/style/variables');

let extractVanilla = new ExtractTextPlugin('vanilla.css', { allChunks: true});
let extractLocal = new ExtractTextPlugin('local.css', { allChunks: true });

module.exports = {
  context: path.resolve(__dirname, '..'),
  entry: [
    'babel-polyfill',
    `webpack-hot-middleware/client?path=${WEBPACK_DEV_URL}/__webpack_hmr`,
    'webpack/hot/only-dev-server',
    'react-hot-loader/patch',
    './src/common'
  ],
  output: {
    path: path.join(__dirname, '../public/static'),
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    publicPath: `${WEBPACK_DEV_URL}/static/`
  },
  plugins: [
    new AssetsPlugin(),
    extractVanilla,
    extractLocal,
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    }),
    function() {
      this.plugin('done', function(stats) {
        fs.writeFileSync(__dirname + '/stats.json', JSON.stringify(stats.toJson()))
      })
    }
  ],
  module: {
    // https://github.com/localForage/localForage/issues/577
    noParse: /node_modules\/localforage\/dist\/localforage\.js$/,
    loaders: [
      {test: /\.js$/i,    loaders: ['babel'], exclude: /node_modules/},
      {test: /\.svg$/i,   loader: 'file-loader?name=icons/[hash].[ext]'},
      {test: /\.scss$/i,  loader: extractVanilla.extract('style-loader', ['css-loader', 'sass-loader'])},
      {test: /\.css$/i,   loader: extractLocal.extract(
        'style-loader!postcss-loader',
        'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'
      )}
    ]
  },
  devtool: 'source-map',
  postcss: function () {
    return [ vars({ variables: () => sharedVars }), autoprefixer ];
  },
  debug: true
};
