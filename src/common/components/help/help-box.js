import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './help.css';

export default class HelpBox extends Component {
  render() {
    const boxClass = classNames({
      [styles.strip]: true,
      [styles.flexible]: this.props.isFlex
    });
    return (
      <div className={ boxClass }>
        {this.props.children}
      </div>
    );
  }
}

HelpBox.propTypes = {
  isFlex: PropTypes.bool,
  children: PropTypes.node.isRequired
};
