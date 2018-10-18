import PropTypes from 'prop-types';
import React from 'react';
import styles from './table.css';

export default function Head(props) {
  return (
    <header className={ styles.head }>
      { props.children }
    </header>
  );
}

Head.propTypes = {
  children: PropTypes.node
};
