import React, { PropTypes } from 'react';
import styles from './list-divided.css';

export default function ListDivided(props) {
  const className = props.className || '';

  return (
    <ul className={`${styles.listDivided} ${className}`}>
      { props.children }
    </ul>
  );
}

ListDivided.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};
