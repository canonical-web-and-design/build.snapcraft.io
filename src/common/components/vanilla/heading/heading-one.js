import React, { PropTypes } from 'react';
import styles from './heading-one.css';

export default function HeadingOne(props) {
  return (
    <h1 className={ styles['heading-one'] }>
      { props.children }
    </h1>
  );
}

HeadingOne.propTypes = {
  children: PropTypes.node
};
