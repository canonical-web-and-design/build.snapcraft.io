import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import styles from './header.css';

export default class Header extends Component {
  render() {
    return (
      <div className={ styles.header }>
        <nav className={ styles.container }>
          <Link className={ styles.logo } to="/">
            Snapcraft
          </Link>
          <div className={ styles.sideNav }>
            { this.props.authenticated
              ? <a href="/auth/logout" className={ styles.link }>Log out</a>
              : <a href="/auth/authenticate" className={ styles.link }>Log in</a>
            }
          </div>
        </nav>
      </div>
    );
  }
}

Header.propTypes = {
  authenticated: PropTypes.bool
};
