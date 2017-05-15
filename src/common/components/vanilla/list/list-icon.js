import React, { PropTypes } from 'react';
import styles from './list-icon.css';

export default function ListWithIcon(props) {
  const className = props.className || '';

  return (
    <ul className={`${styles.listIcon} ${className}`}>
      { props.children }
    </ul>
  );
}

ListWithIcon.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
