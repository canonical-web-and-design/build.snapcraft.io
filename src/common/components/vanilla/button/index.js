import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import Spinner from '../../spinner';
import style from './button.css';

function createButtonComponent(Component) {
  function ButtonComponent(props) {
    const { appearance='primary', flavour='normal', isSpinner=false, icon, ...rest } = props;

    const className = classNames({
      [style[appearance]]: true,
      [style[flavour]]: style[flavour] !== undefined, // add flavour class only if any styles are defined for it
      [style.hasSpinner]: isSpinner
    });

    return (
      <Component {...rest} className={ className }>
        { isSpinner &&
          <span className={ style.spinner }><Spinner light/></span>
        }
        <span className={style.text}>{ props.children }</span>
        { icon &&
          <img className= { style.icon } src={ icon } />
        }
      </Component>
    );
  }

  ButtonComponent.propTypes = {
    isSpinner: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.string,
    onClick: PropTypes.func,
    appearance: React.PropTypes.oneOf(['positive', 'negative', 'neutral', 'base']),
    flavour: React.PropTypes.oneOf(['normal','bigger', 'smaller']),
    href: PropTypes.string,
    icon: PropTypes.string
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
