import React, { PropTypes } from 'react';
import styles from './table.css';

export default function TD(props) {
  return (
    <td className={ styles.td }>
      { props.children }
    </td>
  );
}

TD.propTypes = {
  children: PropTypes.node
};
