import React, { PropTypes } from 'react';
import styles from './heading-six.css';

export default function HeadingSix(props) {
  return (
    <h6 className={ styles['heading-six'] }>
      { props.children }
    </h6>
  );
}

HeadingSix.propTypes = {
  children: PropTypes.node
};
