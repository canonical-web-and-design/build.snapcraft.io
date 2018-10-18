import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';

import style from '../../../style/vanilla/css/breadcrumbs.css';

const breadcrumbsStyle = (element = '', modifier = '') => {
  element = element ? '__' + element : '';
  modifier = modifier ? '--' + modifier : '';

  const className = `p-breadcrumbs${element}${modifier}`;

  return style[className];
};

export default function Breadcrumbs({ children }) {
  return (
    <ul className={ breadcrumbsStyle() }>
      { children }
    </ul>
  );
}

Breadcrumbs.propTypes = {
  children: PropTypes.node
};

export function BreadcrumbsLink({ to, children }) {
  return (
    <li className={ breadcrumbsStyle('item') }>
      { to
        ? <Link className={ breadcrumbsStyle('link') } to={to}>{ children }</Link>
        : children
      }
    </li>
  );
}

BreadcrumbsLink.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node
};
