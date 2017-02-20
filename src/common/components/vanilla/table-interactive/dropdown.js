import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Dropdown(props) {
  return (
    <div className={ styles.dropdown }>
      { props.children }
    </div>
  );
}

Dropdown.propTypes = {
  children: PropTypes.node
};
