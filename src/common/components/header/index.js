import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { signOut } from '../../actions/auth-store';

import { conf } from '../../helpers/config';

import style from '../../style/vanilla/css/navigation.css';
import containerStyles from '../../containers/container.css';

import { IconChevron, IconUser } from '../vanilla-modules/icons';

const SNAPCRAFT_URL = conf.get('SNAPCRAFT_URL');
const brandmark = 'https://assets.ubuntu.com/v1/7f93bb62-snapcraft-logo--web-white-text.svg';

export default class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showUserDropdown: false
    };
  }

  render() {
    const { authenticated, user } = this.props;

    return (
      <header id="navigation" className={ style['p-navigation'] }>
        <div className={ containerStyles['wrapper'] }>
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
            <ul className={ style['p-navigation__links'] } role="menu">
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a href={ `${SNAPCRAFT_URL}/store` }>Store</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a href={ `${SNAPCRAFT_URL}/blog` }>Blog</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a className={ authenticated ? '' : style['is-selected'] } href={ `${SNAPCRAFT_URL}/build` }>Build</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a href="https://docs.snapcraft.io">Docs</a>
              </li>
              <li className={ style['p-navigation__link'] } role="menuitem">
                <a className={ style['p-link--external'] } href="https://forum.snapcraft.io/categories">Forum</a>
              </li>
            </ul>
            { authenticated
              ? (
                <ul className={ style['p-navigation__links--right'] } role="menu">
                  <li className={ style['p-navigation__link'] } role="menuitem">
                    <a className={ style['p-dropdown__toggle'] } aria-controls="account-menu" aria-expanded={ this.state.showUserDropdown }
                      onClick={ this.onDropdownClick.bind(this)}
                    >
                      {user.name || user.login}<IconChevron className={ style['p-nav-icon'] }/>
                    </a>
                    <ul className={ style['p-dropdown__menu'] } id="account-menu" aria-hidden={ !this.state.showUserDropdown }>
                      <li className={ style['p-navigation__link'] } role="menuitem">
                        <a href={ `${SNAPCRAFT_URL}/account/snaps` } >My published snaps</a>
                      </li>
                      <li className={ style['p-navigation__link'] } role="menuitem">
                        <a href={ `/user/${user.login}`} className={ style['is-selected'] }>Build with GitHub</a>
                      </li>
                      <li className={ style['p-navigation__link'] } role="menuitem">
                        <a href={ `${SNAPCRAFT_URL}/account/details` }>Account details</a>
                      </li>
                      <li className={ style['p-navigation__link'] } role="menuitem">
                        <a href="/auth/logout" onClick={ this.onLogoutClick.bind(this)}>Sign out</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              ) : (
                <ul className={ style['p-navigation__links--right'] } role="menu">
                  <li className={ style['p-navigation__link'] } role="menuitem">
                    <a href="/auth/authenticate">
                      <IconUser className={ style['p-nav-icon'] }/>Developer account
                    </a>
                  </li>
                </ul>
              )
            }
          </nav>
        </div>
      </header>
    );
  }

  onLogoutClick() {
    this.props.dispatch(signOut());
  }

  onDropdownClick() {
    this.setState({
      showUserDropdown: !this.state.showUserDropdown
    });
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
