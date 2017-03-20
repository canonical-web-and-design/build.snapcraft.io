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
    'mocha',
    'react'
  ],
  'rules': {
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1
      }
    ],
    'react/jsx-no-target-blank': [
      2
    ],
    'react/jsx-indent': [
      'error',
      2
    ],
    'react/jsx-indent-props': [
      'error',
      2
    ],
    'react/jsx-closing-bracket-location': [
      'error',
      'tag-aligned'
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'mocha/handle-done-callback': ['error'],
    'mocha/no-exclusive-tests': ['error'],
    'mocha/no-return-and-callback': ['error']
  }
};
