import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import styles from './table.css';

export default function DataLink(props) {
  const Wrapper = (props.to || props.onClick) ? Link : 'div';

  const className = classNames({
    [styles.dataLink]: true,
    [styles.expandable]: props.expandable,
    [styles.active]: props.active,
    [styles.centered]: props.centered
  });

  let to = props.to;
  let onClick = props.onClick;

  if (props.onClick && !to) {
    to = '#'; // default href to make sure link is focusable and clickable (also by keyboard)

    onClick = (event) => {
      event.preventDefault(); // to make sure we don't go to '#' URL
      props.onClick(event);
    };
  }

  return (
    <Wrapper
      className={ className }
      style={ { width: `${props.col}%` } }
      to={ to }
      onClick={ onClick }
    >
      { props.children }
    </Wrapper>
  );
}

DataLink.propTypes = {
  children: PropTypes.node,
  col: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
  expandable: PropTypes.bool,
  active: PropTypes.bool,
  centered: PropTypes.bool
};
