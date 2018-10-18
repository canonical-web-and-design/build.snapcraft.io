import PropTypes from 'prop-types';
import React from 'react';
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
