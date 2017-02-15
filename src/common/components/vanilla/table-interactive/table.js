import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Table(props) {
  return (
    <section className={ styles.table }>
      { props.children }
    </section>
  );
}

Table.propTypes = {
  children: PropTypes.node
};
