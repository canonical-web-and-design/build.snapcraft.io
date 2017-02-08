import React, { PropTypes } from 'react';
import styles from './heading-two.css';

export default function HeadingTwo(props) {
  return (
    <h2 className={ styles['heading-two'] }>
      { props.children }
    </h2>
  );
}

HeadingTwo.propTypes = {
  children: PropTypes.node
};
