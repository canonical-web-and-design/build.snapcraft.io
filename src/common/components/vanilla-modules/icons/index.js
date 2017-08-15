import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/icons.css';

export default function Icon (props) {
  const { value, className, ...more } = props;

  const iconClass = classNames(
    styles[value],
    className
  );

  return (
    <i
      className={iconClass}
      {...more}
    />
  );
}

Icon.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string.isRequired
};
