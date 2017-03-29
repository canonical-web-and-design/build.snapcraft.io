import React, { Component, PropTypes } from 'react';

import styles from './notification.css';

export default class Notification extends Component {
  render() {
    const { status, message, onRemoveClick } = this.props;
    const statusSuffix = status ? '-' + status : '';

    return (
      <div className={ styles['notification' + statusSuffix] }>
        <p className={ styles['response' + statusSuffix] }>
          { status && this.getStatus(this.props.status) }
          { message }
          { this.props.children }
        </p>
        { onRemoveClick &&
          <a tabIndex="0" className={styles.remove} onClick={onRemoveClick} />
        }
      </div>
    );
  }

  getStatus(status) {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span className={ styles.status }>{ statusString }: </span>
    );
  }
}

Notification.propTypes = {
  children: PropTypes.node,
  message: PropTypes.string,   // Alias of "children"
  status: PropTypes.oneOf([ 'error', 'success','warning' ]),
  onRemoveClick: PropTypes.func
};
