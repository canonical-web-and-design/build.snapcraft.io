const path = require('path');
const sass = require('node-sass');

module.exports = {
  generateScopedName: '[name]__[local]___[hash:base64:5]',
  // need different config for scss!!
  extensions: [ '.scss', '.css' ],
  preprocessCss: (data, filename) => {

    if (path.extname(filename) !== '.scss') {
      return data;
    }

    return sass.renderSync({
      data,
      file: filename,
    }).css;
  }
};
