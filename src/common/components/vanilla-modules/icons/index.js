import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/icons.css';

const Icon = (props) => {
  const I = props.icon;
  const iconClassnames = {
    plus: 'p-icon--plus',
    minus: 'p-icon--minus',
    expand: 'p-icon--expand',
    collapse: 'p-icon--collapse',
    chevron: 'p-icon--chevron',
    close: 'p-icon--close',
    help: 'p-icon--help',
    information: 'p-icon--information',
    question: 'p-icon--question',
    delete: 'p-icon--delete',
  };
  const className = props.className;
  const iconClass = classNames({
    [styles[iconClassnames[I]]]: true,
    [className]: className
  });
  return (
    <i
      aria-hidden='true'
      className={ iconClass }
    />
  );
};

Icon.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.oneOf(['plus', 'minus', 'expand', 'collapse', 'chevron', 'close'])
};

const PlusIcon = (props) => Icon({
  ...props,
  icon: 'plus'
});

export {
  Icon,
  PlusIcon
};
