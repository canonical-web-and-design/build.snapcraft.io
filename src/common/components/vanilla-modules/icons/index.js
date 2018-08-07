import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/icons.css';

// Creates icon style class name
const iconStyle = (modifier = '') => {
  modifier = modifier ? '--' + modifier : '';

  const className = `p-icon${modifier}`;

  return styles[className];
};

// Icon component
const Icon = (props) => {

  // Icons can be effected by appearance, color and size
  const appearance = props.appearance;
  const inheritColor = props.inheritColor;
  const size = props.size;
  const iconClass = classNames({
    [iconStyle(appearance)]: true,
    [iconStyle(size)]: true,
    [iconStyle('inherit-color')]: inheritColor,
    [props.className]: props.className
  });

  // Aria-hidden is required as icons shouldn't be visible to
  // screen readers
  return (
    <i
      aria-hidden='true'
      className={ iconClass }
    />
  );
};

Icon.propTypes = {
  appearance: PropTypes.oneOf([
    'plus',
    'minus',
    'expand',
    'collapse',
    'chevron',
    'close',
    'help',
    'information',
    'question',
    'delete',
    'error',
    'warning',
    'external-link',
    'contextual-menu',
    'menu',
    'code',
    'search',
    'success',
    'copy',
    'share',
    'user',
    'spinner'
  ]),
  inheritColor: PropTypes.bool,
  size: PropTypes.oneOf(['medium', 'large', 'x-large', 'xx-large']),
  className: PropTypes.string
};

// Icon type components
const IconPlus = (props) => Icon({
  ...props,
  appearance: 'plus'
});

const IconMinus = (props) => Icon({
  ...props,
  appearance: 'minus'
});

const IconExpand = (props) => Icon({
  ...props,
  appearance: 'expand'
});

const IconCollapse = (props) => Icon({
  ...props,
  appearance: 'collapse'
});

const IconChevron = (props) => Icon({
  ...props,
  appearance: 'chevron'
});

const IconClose = (props) => Icon({
  ...props,
  appearance: 'close'
});

const IconHelp = (props) => Icon({
  ...props,
  appearance: 'help'
});

const IconInformation = (props) => Icon({
  ...props,
  appearance: 'information'
});

const IconQuestion = (props) => Icon({
  ...props,
  appearance: 'question'
});

const IconDelete = (props) => Icon({
  ...props,
  appearance: 'delete'
});

const IconError = (props) => Icon({
  ...props,
  appearance: 'error'
});

const IconWarning = (props) => Icon({
  ...props,
  appearance: 'warning'
});

const IconExternalLink = (props) => Icon({
  ...props,
  appearance: 'external-link'
});

const IconContextualMenu = (props) => Icon({
  ...props,
  appearance: 'contextual-menu'
});

const IconMenu = (props) => Icon({
  ...props,
  appearance: 'menu'
});

const IconCode = (props) => Icon({
  ...props,
  appearance: 'code'
});

const IconSearch = (props) => Icon({
  ...props,
  appearance: 'search'
});

const IconSuccess = (props) => Icon({
  ...props,
  appearance: 'success'
});

const IconCopy = (props) => Icon({
  ...props,
  appearance: 'copy'
});

const IconShare = (props) => Icon({
  ...props,
  appearance: 'share'
});

const IconUser = (props) => Icon({
  ...props,
  appearance: 'user'
});

const IconSpinner = (props) => Icon({
  ...props,
  appearance: 'spinner'
});

export {
  Icon,
  IconPlus,
  IconMinus,
  IconExpand,
  IconSpinner,
  IconUser,
  IconCollapse,
  IconShare,
  IconChevron,
  IconClose,
  IconCopy,
  IconHelp,
  IconSuccess,
  IconCode,
  IconSearch,
  IconDelete,
  IconMenu,
  IconContextualMenu,
  IconError,
  IconWarning,
  IconExternalLink,
  IconInformation,
  IconQuestion
};
