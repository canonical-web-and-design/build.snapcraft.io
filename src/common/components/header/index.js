import React, { Component } from 'react';
import { Link } from 'react-router';

import styles from './header.css';

export default class Header extends Component {
  render() {
    return (
      <div className={ styles.header }>
        <nav className={ styles.container }>
          <Link className={ styles.logo } to="/">
            build.snapcraft.io
          </Link>
          <div className={ styles.sideNav }>
            <a href="http://snapcraft.io" className={ styles.link }>snapcraft.io</a>
          </div>
        </nav>
      </div>
    );
  }
}
