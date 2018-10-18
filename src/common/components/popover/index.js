import PropTypes from 'prop-types';
import React from 'react';

import styles from './popover.css';

const Popover = (props) => {
  return (
    <div
      className={styles.popover}
      style={{ top: `${props.top}px`, left:`${props.left}px` }}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
};

Popover.propTypes = {
  left: PropTypes.number,
  top: PropTypes.number,
  children: PropTypes.node,
  onClick: PropTypes.func
};

export default Popover;
