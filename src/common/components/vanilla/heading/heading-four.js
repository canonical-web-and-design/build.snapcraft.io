import React, { PropTypes } from 'react';
import styles from './heading-four.css';

export default function HeadingFour(props) {
  return (
    <h4 className={ styles['heading-four'] }>
      { props.children }
    </h4>
  );
}

HeadingFour.propTypes = {
  children: PropTypes.node
};
