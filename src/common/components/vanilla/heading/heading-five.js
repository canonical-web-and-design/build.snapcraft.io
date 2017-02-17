import React, { PropTypes } from 'react';
import styles from './heading-five.css';

export default function HeadingFive(props) {
  return (
    <h5 className={ styles['heading-five'] }>
      { props.children }
    </h5>
  );
}

HeadingFive.propTypes = {
  children: PropTypes.node
};
