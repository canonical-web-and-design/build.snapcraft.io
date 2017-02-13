import React, { PropTypes } from 'react';
import styles from './table.css';

export default function TR(props) {
  return (
    <tr className={ styles.tr }>
      { props.children }
    </tr>
  );
}

TR.propTypes = {
  children: PropTypes.node
};
