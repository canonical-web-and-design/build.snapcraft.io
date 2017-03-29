import { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import localforage from 'localforage';

import { BETA_NOTIFICATION_TOGGLE } from '../../reducers/beta-notification';
import { BETA_NOTIFICATION_DISMISSED_KEY } from './index';

const BETA_NOTIFICATION_DELAY = 2 * 60 * 1000; // 2 minutes

export class BetaNotificationTriggerView extends Component {
  notificationTimeout = null;

  async componentDidMount() {
    const notificationDismissed = await localforage.getItem(BETA_NOTIFICATION_DISMISSED_KEY);

    if (this.props.authenticated && !notificationDismissed) {
      this.notificationTimeout = setTimeout(this.props.showNotification, BETA_NOTIFICATION_DELAY);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.notificationTimeout);
  }

  render() {
    return null; // we don't render anything
  }
}

BetaNotificationTriggerView.propTypes = {
  authenticated: PropTypes.bool,
  showNotification: PropTypes.func
};

function mapStateToProps(state) {
  return { ...state.auth };
}

function mapDispatchToProps(dispatch) {
  return {
    showNotification: () => dispatch({
      type: BETA_NOTIFICATION_TOGGLE,
      payload: true
    })
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BetaNotificationTriggerView);
