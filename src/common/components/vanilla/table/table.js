import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Table(props) {
  return (
    <table className={ styles.table }>
      { props.children }
    </table>
  );
}

Table.propTypes = {
  children: PropTypes.node
};
