import React, { PropTypes } from 'react';

import style from './message.css';

export default function Message({ children, status, text }) {

  return <div>
    { (children || text) &&
      <p className={ style[status] }>{ children || text }</p>
    }
  </div>;
}

Message.propTypes = {
  children: PropTypes.node,
  text: PropTypes.string,
  status: PropTypes.oneOf([ 'error', 'success', 'info', 'warning' ])
};
