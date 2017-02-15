import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Data(props) {
  return (
    <div className={ styles.data } style={ { width: `${props.col}%` } }>
      { props.children }
    </div>
  );
}

Data.propTypes = {
  children: PropTypes.node,
  col: PropTypes.string
};
