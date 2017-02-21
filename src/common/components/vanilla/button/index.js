import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import Spinner from '../../spinner';
import style from './button.css';

const defaultProps = {
  disabled: PropTypes.bool,
  children: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string,
  appearance: React.PropTypes.oneOf(['primary', 'secondary', 'positive', 'neutral']),
  flavour: React.PropTypes.oneOf(['normal','embiggened']),
  href: PropTypes.string
};

export default function Button(props) {
  const { appearance='primary', flavour='normal', isSpinner=false, ...rest } = props;
  return (
    <button {...rest} className={ `${style[appearance]} ${style[flavour]}` }>
      { isSpinner && <span className={ style.spinner }><Spinner /></span> }
      { props.children }
    </button>
  );
}

export function Anchor(props) {
  const { appearance='primary', flavour='normal', icon, ...rest } = props;
  return (
    <a {...rest} className={ `${style[appearance]} ${style[flavour]}` }>
      { props.children }
      { icon && <img className= { style.icon } src={ icon } /> }
    </a>
  );
}

export function LinkButton(props) {
  const { appearance='primary', ...rest } = props;
  return <Link {...rest} className={ style[appearance] } />;
}

Button.propTypes = {
  ...defaultProps
};

Anchor.propTypes = {
  ...defaultProps
};

LinkButton.propTypes = {
  ...defaultProps
};
