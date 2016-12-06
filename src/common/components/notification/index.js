import React, { Component, PropTypes } from 'react';

import styles from './notification.css';

export default class Notification extends Component {
  render() {
    const { status, message, action, actionText } = this.props;
    const statusSuffix = status ? '-' + status : '';

    return (
      <div className={ styles['notification' + statusSuffix] }>
        <p className={ styles['response' + statusSuffix] }>
          { status && this.getStatus(this.props.status) }
          { message }
          { this.props.children }
          { action && actionText &&
            <a
              className={ styles.action }
              onClick={ this.onActionClick.bind(this) }
            >
              { actionText }
            </a>
          }
        </p>
      </div>
    );
  }

  onActionClick(event) {
    event.preventDefault();

    this.props.action();
  }

  getStatus(status) {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span className={ styles.status }>{ statusString }: </span>
    );
  }
}

Notification.propTypes = {
  children: PropTypes.string,
  message: PropTypes.string,   // Alias of "children"
  status: PropTypes.oneOf([ 'error', 'success','warning' ]),
  action: PropTypes.func,
  actionText: PropTypes.string
};
