const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = [
  {
    test: /\.js$/i,
    exclude: /node_modules/,
    loaders: ['babel'],
  },
  {
    test: /\.css$/i,
    loader: ExtractTextPlugin.extract(
      [
        'style-loader',
        'postcss-loader'
      ].join('!'),
      [
        loader(
          'css-loader',
          [
            'modules',
            'importLoaders=1',
            'localIdentName=[name]__[local]___[hash:base64:5]'
          ]
        ),
        'postcss-loader'
      ].join('!')
    )
  },
  {
    test: /\.svg$/i,
    loader: 'file-loader?name=icons/[hash].[ext]'
  }
];

function loader(name, options) {
  if (options.length > 0) {
    return name + '?' + options.join('&');
  }

  return name;
}
