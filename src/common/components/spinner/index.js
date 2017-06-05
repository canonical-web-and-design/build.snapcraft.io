import React, { Component, PropTypes } from 'react';

import spinnerDark from './spinner-dark.svg';
import spinnerLight from './spinner-light.svg';

import styles from './spinner.css';

export default class Spinner extends Component {
  render() {
    let size = this.props.size || '100%';

    return (
      <img
        src={ this.props.light ? spinnerLight : spinnerDark }
        className={ styles.spinner }
        width={ size }
        height={ size }
      />
    );
  }
}

Spinner.propTypes = {
  size: PropTypes.string,
  light: PropTypes.bool
};
