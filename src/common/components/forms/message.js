import PropTypes from 'prop-types';
import React from 'react';

import style from './message.css';

export default function Message({ children, status, text }) {

  return <div>
    { (children || text) &&
      <div className={ style[status] }>{ children || text }</div>
    }
  </div>;
}

Message.propTypes = {
  children: PropTypes.node,
  text: PropTypes.string,
  status: PropTypes.oneOf([ 'error', 'success', 'info', 'warning' ])
};
