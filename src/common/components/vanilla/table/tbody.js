import React, { PropTypes } from 'react';
import styles from './table.css';

export default function TBody(props) {
  return (
    <tbody className={ styles.tbody }>
      { props.children }
    </tbody>
  );
}

TBody.propTypes = {
  children: PropTypes.node
};
