import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/lists.css';
import customStyles from './customLists.css';

export function List({ children }) {
  return (
    <ul className={styles['p-list']}>
      { children }
    </ul>
  );
}

List.propTypes = {
  children: PropTypes.node
};

export function ListItem({ children, isTicked }) {
  const className = classNames({
    [styles['p-list__item']]: true,
    [styles['is-ticked']]: isTicked,
    [customStyles.isTickedGreen]: isTicked
  });

  return (
    <li className={className}>
      { children }
    </li>
  );
}

ListItem.propTypes = {
  children: PropTypes.node,
  isTicked: PropTypes.bool
};
