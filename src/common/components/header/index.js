import React, { Component, PropTypes } from 'react';

import { signOut } from '../../actions/auth-store';

import containerStyles from '../../containers/container.css';
import style from '../../style/vanilla/css/navigation.css';

const brandmark = 'https://assets.ubuntu.com/v1/7f93bb62-snapcraft-logo--web-white-text.svg';

export default class Header extends Component {
  render() {
    const { authenticated, user } = this.props;

    return (
      <header id="navigation" className={ style['p-navigation'] }>
        <div className={ containerStyles.wrapper }>
          <div className={ style['p-navigation__banner'] }>
            <div className={ style['p-navigation__logo'] }>
              <a className={ style['p-navigation__link'] } href="https://snapcraft.io">
                <img className={ style['p-navigation__image'] } src={ brandmark } alt="Snapcraft" />
              </a>
            </div>
            <a href="#navigation" className={ style['p-navigation__toggle--open'] } title="menu">Menu</a>
            <a href="#navigation-closed" className={ style['p-navigation__toggle--close'] } title="close menu">Close menu</a>
          </div>
          <nav className={ style['p-navigation__nav'] } role="menubar">
            <ul className={ style['p-navigation__links']} role="menu">
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a href="https://snapcraft.io/store/">Store</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a className={ style['is-selected'] } href="/">Build</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a className={ style['p-link--external'] } href="https://dashboard.snapcraft.io/snaps">My snaps</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a href="https://docs.snapcraft.io">Docs</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a className={ style['p-link--external'] } href="https://forum.snapcraft.io/categories">Forum</a>
              </li>
            </ul>
            { authenticated
              ?
                <ul className={ style['p-navigation__links--right']} role="menu">
                  <li className={ style['p-navigation__item'] } role="menuitem">
                    <a>Hi, {user.name || user.login}</a>
                  </li>
                  <li className={ style['p-navigation__link'] } role="menuitem">
                    <a href="/auth/logout" onClick={ this.onLogoutClick.bind(this)}>
                      Sign out
                    </a>
                  </li>
                </ul>
              :
                <ul className={ style['p-navigation__links--right']} role="menu">
                  <li className={ style['p-navigation__link'] } role="menuitem">
                    <a href="/auth/authenticate">Sign in with GitHub</a>
                  </li>
                </ul>
            }
          </nav>
        </div>
      </header>
    );
  }

  onLogoutClick() {
    this.props.dispatch(signOut());
  }
}

Header.propTypes = {
  authenticated: PropTypes.bool,
  user: PropTypes.shape({
    login: PropTypes.string,
    name: PropTypes.string
  }),
  dispatch: PropTypes.func.isRequired
};
