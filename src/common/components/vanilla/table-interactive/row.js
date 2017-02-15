import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Row(props) {
  return (
    <div className={ styles.row }>
      { props.children }
    </div>
  );
}

Row.propTypes = {
  children: PropTypes.node
};
