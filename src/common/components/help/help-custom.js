import React, { Component, PropTypes } from 'react';

import { HeadingThree } from '../vanilla/heading/';
import styles from './help.css';


export default class HelpCustom extends Component {
  render() {
    const { children, headline } = this.props;

    return (
      <div className={styles.helpWrapper}>
        <HeadingThree>{ headline }</HeadingThree>
        {children}
      </div>
    );
  }
}

HelpCustom.propTypes = {
  headline: PropTypes.string.isRequired,
  children: PropTypes.node
};
