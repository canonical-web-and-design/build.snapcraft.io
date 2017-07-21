import React, { Component, PropTypes } from 'react';

// TODO: dismiss icon styles
// import styles from './notification.css';
import styles from '../../../style/vanilla/css/notifications.css';

const notificationStyle = (element = '', modifier = '') => {
  element = element ? '__' + element : '';
  modifier = modifier ? '--' + modifier : '';

  const className = `p-notification${element}${modifier}`;

  return styles[className];
};

export default class Notification extends Component {
  render() {
    const { status, appearance, onRemoveClick } = this.props;

    return (
      <div className={ notificationStyle('', appearance) }>
        <p className={ notificationStyle('response') }>
          { status && this.getStatus(this.props.status) }
          { this.props.children }
        </p>
        {/*  TODO: dismiss icon styles */}
        { onRemoveClick &&
          <a tabIndex="0" className={styles.remove} onClick={onRemoveClick} />
        }
      </div>
    );
  }

  getStatus(status) {
    const statusString = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span className={ notificationStyle('status') }>{ statusString }:</span>
    );
  }
}

Notification.propTypes = {
  children: PropTypes.node,
  appearance: PropTypes.oneOf([ 'positive', 'caution', 'negative', 'information' ]),
  status: PropTypes.string,
  onRemoveClick: PropTypes.func
};
