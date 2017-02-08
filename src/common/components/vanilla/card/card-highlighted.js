import React, { PropTypes } from 'react';
import styles from './card-highlighted.css';

export default function CardHighlighted(props) {
  return (
    <div className={ styles['card-highlighted'] }>
      { props.children }
    </div>
  );
}

CardHighlighted.propTypes = {
  children: PropTypes.node
};
