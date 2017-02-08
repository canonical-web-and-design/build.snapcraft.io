import React, { PropTypes } from 'react';
import styles from './button-positive.css';

export default function ButtonPositive(props) {
  return (
    <button className={ styles['button-positive'] } onClick={ props.onClick }>
      { props.children }
    </button>
  );
}

ButtonPositive.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func
};
