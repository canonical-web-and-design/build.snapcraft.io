import React, { PropTypes } from 'react';
import styles from './table.css';

export default function THead(props) {
  return (
    <thead className={ styles.thead }>
      { props.children }
    </thead>
  );
}

THead.propTypes = {
  children: PropTypes.node
};
