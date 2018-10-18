import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/notifications.css';
import customStyles from './notification.css';

const notificationStyle = (element = '', modifier = '') => {
  element = element ? '__' + element : '';
  modifier = modifier ? '--' + modifier : '';

  const className = `p-notification${element}${modifier}`;

  return styles[className];
};

export default class Notification extends Component {
  render() {
    const { status, appearance, onRemoveClick } = this.props;

    const className = classNames({
      [notificationStyle('', appearance)]: true,
      [customStyles.hasDismiss]: onRemoveClick
    });

    return (
      <div className={ className }>
        <p className={ notificationStyle('response') }>
          { status && this.getStatus(this.props.status) }
          { this.props.children }
        </p>
        { onRemoveClick &&
          <a tabIndex="0" className={customStyles.dismiss} onClick={onRemoveClick} />
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
