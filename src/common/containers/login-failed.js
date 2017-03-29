import React, { PropTypes, Component } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import Notification from '../components/vanilla/notification';

import styles from './container.css';

export class LoginFailed extends Component {
  render() {
    const { authError } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet title='Login failed' />
        <Notification status="error" { ...authError } />
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
