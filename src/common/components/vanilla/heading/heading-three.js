import React, { PropTypes } from 'react';
import styles from './heading-three.css';

export default function HeadingThree(props) {
  return (
    <h3 className={ styles['heading-three'] }>
      { props.children }
    </h3>
  );
}

HeadingThree.propTypes = {
  children: PropTypes.node
};
