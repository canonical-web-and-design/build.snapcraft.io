import React, { Component, PropTypes } from 'react';

import styles from './help.css';

export default class HelpBox extends Component {
  render() {
    return (
      <div className={ styles.strip }>
        {this.props.children}
      </div>
    );
  }
}

HelpBox.propTypes = {
  children: PropTypes.node.isRequired
};
