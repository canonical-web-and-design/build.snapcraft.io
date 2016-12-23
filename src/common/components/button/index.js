import React, { PropTypes } from 'react';

import style from './button.css';

const defaultProps = {
  disabled: PropTypes.bool,
  children: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
  appearance: React.PropTypes.oneOf(['primary', 'secondary']),
  href: PropTypes.string
};

export default function Button(props) {
  const { appearance='primary', ...rest } = props;
  return <button {...rest} className={ style[appearance] } />;
}

export function Anchor(props) {
  const { appearance='primary', ...rest } = props;
  return <a {...rest} className={ style[appearance] } />;
}

Button.propTypes = {
  ...defaultProps
};

Anchor.propTypes = {
  ...defaultProps
};
