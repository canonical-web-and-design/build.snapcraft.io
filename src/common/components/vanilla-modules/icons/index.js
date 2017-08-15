import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/icons.css';

const iconStyle = (icon = '') => {
  icon = icon ? '--' + icon : '';

  const className = `p-icon${icon}`;

  return styles[className];
};

const Icon = (props) => {
  const appearance = props.appearance;
  const iconClass = classNames({
    [iconStyle(appearance)]: true,
    [iconStyle(size)]: true,
    [iconStyle(color)]: true
  });

  return (
    <i
      aria-hidden='true'
      className={ iconClass }
    />
  );
};

Icon.propTypes = {
  appearance: PropTypes.oneOf([
    'plus',
    'minus',
    'expand',
    'collapse',
    'chevron',
    'close',
    'help',
    'information',
    'question',
    'delete',
    'error',
    'warning',
    'external-link',
    'contextual-menu',
    'menu',
    'code',
    'search',
    'success',
    'copy',
    'share',
    'user',
    'spinner'
  ]),
  color: PropTypes.oneOf(['inherit-color']),
  size: PropTypes.oneOf(['medium', 'large', 'x-large', 'xx-large'])
};

export {
  Icon
};
