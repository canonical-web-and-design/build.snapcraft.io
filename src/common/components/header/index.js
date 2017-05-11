import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import { signOut } from '../../actions/auth-store';
import styles from './header.css';

const wordmark = 'https://assets.ubuntu.com/v1/d45097a4-snapcraft.io-logotype.svg';

export default class Header extends Component {
  render() {
    const { authenticated, user } = this.props;

    return (
      <div className={ styles.header }>
        <nav className={ styles.container }>
          <Link className={ `${styles.logo} ${styles.beta}`} to="/">
            <img src={ wordmark } alt="Snapcraft.io" height={ 28 } />
          </Link>
          { authenticated
            ?
              <div className={ styles.sideNav }>
                { user &&
                  <span className={ styles.username } >
                    Hi, {user.name || user.login}
                  </span>
                }
                <a
                  className={ styles.link }
                  onClick={ this.onLogoutClick.bind(this) }
                >
                  Sign out
                </a>
              </div>
            :
              <div className={ styles.sideNav }>
                <a href="/auth/authenticate" className={ styles.link }>Sign in</a>
              </div>
          }
        </nav>
      </div>
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
