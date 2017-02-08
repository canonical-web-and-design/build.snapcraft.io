import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { Anchor } from '../components/button';

import styles from './container.css';

class Landing extends Component {
  render() {
    return (
      <div className={ styles.container }>
        <h2>Auto-build and publish software for any Linux system.</h2>
        <p>Just a placeholder landing page...</p>
        <Anchor href="/auth/authenticate">Set Up in Minutes</Anchor>
      </div>
    );
  }
}

Landing.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object,
  router: PropTypes.object
};

function mapStateToProps(state) {
  const {
    auth
  } = state;

  return {
    auth
  };
}

export default connect(mapStateToProps)(Landing);
