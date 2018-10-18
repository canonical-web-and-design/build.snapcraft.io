import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import { IconSpinner } from '../icons';

import style from '../../../style/vanilla/css/button.css';

// XXX this additonal styles are needed to support non-vanilla spinner and bigger style
import customStyle from './customButton.css';

function createButtonComponent(Component) {
  function ButtonComponent(props) {
    const { appearance='neutral', isBigger=false, isSpinner=false, ...rest } = props;
    const buttonStyle = `p-button--${appearance}`;
    const className = classNames({
      [style[buttonStyle]]: true,
      [customStyle.bigger]: isBigger,
      [customStyle.hasSpinner]: isSpinner
    });

    return (
      <Component {...rest} className={ className }>
        { isSpinner &&
          <span className={ customStyle.icon }>
            <IconSpinner inheritColor />
          </span>
        }
        <span className={ customStyle.text }>{ props.children }</span>
      </Component>
    );
  }

  ButtonComponent.propTypes = {
    isSpinner: PropTypes.bool,
    isBigger: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.node,
    onClick: PropTypes.func,
    appearance: PropTypes.oneOf(['positive', 'negative', 'neutral', 'base', 'brand']),
    href: PropTypes.string
  };

  return ButtonComponent;
}

const Button = createButtonComponent('button');
Button.displayName = 'Button';

const Anchor = createButtonComponent('a');
Anchor.displayName = 'Anchor';

const LinkButton = createButtonComponent(Link);
LinkButton.displayName = 'LinkButton';

export {
  Button as default,
  Anchor,
  LinkButton
};
