module.exports = {
  'globals': {
    'APP_URL': true
  },
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
    'mocha': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
      'experimentalObjectRestSpread': true
    },
    'sourceType': 'module'
  },
  'plugins': [
    'babel',
    'mocha',
    'react'
  ],
  'rules': {
    'babel/semi': [
      'error',
      'always'
    ],
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1
      }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'mocha/handle-done-callback': ['error'],
    'mocha/no-exclusive-tests': ['error'],
    'mocha/no-return-and-callback': ['error'],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'react/jsx-closing-bracket-location': [
      'error',
      'tag-aligned'
    ],
    'react/jsx-indent': [
      'error',
      2
    ],
    'react/jsx-indent-props': [
      'error',
      2
    ],
    'react/jsx-no-target-blank': [
      2
    ],
    'semi': 'off'
  },
  'settings': {
    'react': {
      'version': '15.4.0'
    }
  }
};
