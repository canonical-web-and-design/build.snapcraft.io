import PropTypes from 'prop-types';
import React from 'react';
import styles from './table.css';

export default function Row(props) {
  const className = `${styles.row} ${props.isActive && styles.active}`;
  return (
    <div className={ className }>
      { props.children }
    </div>
  );
}

Row.propTypes = {
  children: PropTypes.node,
  isActive: PropTypes.bool
};
