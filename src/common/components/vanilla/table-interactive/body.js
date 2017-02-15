import React, { PropTypes } from 'react';
import styles from './table.css';

export default function Body(props) {
  return (
    <main className={ styles.body }>
      { props.children }
    </main>
  );
}

Body.propTypes = {
  children: PropTypes.node
};
