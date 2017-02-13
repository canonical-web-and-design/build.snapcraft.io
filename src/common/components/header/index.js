import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import styles from './header.css';

export default class Header extends Component {
  render() {
    const { authenticated, user } = this.props;

    return (
      <div className={ styles.header }>
        <nav className={ styles.container }>
          <Link className={ styles.logo } to="/">
            Snapcraft
          </Link>
          { authenticated
            ?
              <div className={ styles.sideNav }>
                { user && <a href={user.html_url} className={ styles.link }>{user.name}</a> }
                <Link to="/dashboard" className={ styles.link }>Dashboard</Link>
                <a href="/auth/logout" className={ styles.link }>Log out</a>
              </div>
            :
              <div className={ styles.sideNav }>
                <a href="/auth/authenticate" className={ styles.link }>Log in</a>
              </div>
          }
        </nav>
      </div>
    );
  }
}

Header.propTypes = {
  authenticated: PropTypes.bool,
  user: PropTypes.shape({
    login: PropTypes.string,
    name: PropTypes.string
  })
};
