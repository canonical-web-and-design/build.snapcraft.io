import React, { PropTypes } from 'react';
import styles from './table.css';

export default function TH(props) {
  return (
    <th className={ styles.th }>
      { props.children }
    </th>
  );
}

TH.propTypes = {
  children: PropTypes.node
};
