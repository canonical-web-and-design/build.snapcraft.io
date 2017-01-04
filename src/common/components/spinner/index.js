import React, { Component, PropTypes } from 'react';

import spinner from './spinner.svg';
import styles from './spinner.css';

export default class Spinner extends Component {
  render() {
    let size = this.props.size || '100%';

    return (
      <img
        src={ spinner }
        className={ styles.spinner }
        width={ size }
        height={ size }
      />
    );
  }
}

Spinner.propTypes = {
  size: PropTypes.string
};
