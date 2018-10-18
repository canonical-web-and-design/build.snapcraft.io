import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import Notification from '../components/vanilla-modules/notification';

import styles from './container.css';

export class LoginFailed extends Component {
  render() {
    const { authError } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet>
          <title>Login failed</title>
        </Helmet>
        <Notification
          status="error"
          appearance="negative"
        >
          { authError.message }
        </Notification>
      </div>
    );
  }
}

LoginFailed.propTypes = {
  authError: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  const {
    authError
  } = state;

  return {
    authError
  };
}

export default connect(mapStateToProps)(LoginFailed);
