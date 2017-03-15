import React, { PropTypes } from 'react';

import style from './breadcrumbs.css';

export default function Breadcrumbs({ children }) {
  return (
    <div className={ style.breadcrumbs }>
      { children }
    </div>
  );
}

Breadcrumbs.propTypes = {
  children: PropTypes.node
};
