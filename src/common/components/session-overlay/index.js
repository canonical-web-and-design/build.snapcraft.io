import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { signOut } from '../../actions/auth-store';

import Notification from '../vanilla-modules/notification';

import style from './sessionOverlay.css';
import containerStyle from '../../containers/container.css';

export class SessionOverlay extends Component {

  onReloadClick(event) {
    event.preventDefault();
    this.props.clearSession();
    window.location.reload();
  }

  render() {
    return !this.props.isExpired ? null : (
      <div className={style.sessionOverlay}>
        <div className={containerStyle.wrapper}>
          <Notification appearance="caution">
            Your session has expired.
            {' '}
            <a href="/" onClick={this.onReloadClick.bind(this)}>
              Reload the page
            </a>
            {' '}
            and sign in again.
          </Notification>
        </div>
      </div>
    );
  }
}

SessionOverlay.propTypes = {
  isExpired: PropTypes.bool,
  clearSession: PropTypes.func
};

function mapStateToProps(state) {
  const {
    authError
  } = state;

  return {
    isExpired: !!authError.expired
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearSession: () => dispatch(signOut())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SessionOverlay);
