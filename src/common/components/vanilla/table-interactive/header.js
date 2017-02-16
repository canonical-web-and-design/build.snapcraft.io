import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Header(props) {
  return (
    <div className={ styles.header } style={ { width: `${props.col}%` } }>
      { props.children }
    </div>
  );
}

Header.propTypes = {
  children: PropTypes.node,
  col: PropTypes.string
};
