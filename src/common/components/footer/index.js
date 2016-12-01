import React, { Component } from 'react';

import styles from './footer.css';

export default class Footer extends Component {
  render() {
    return (
      <div className={ styles.footer }>
        <div className={ styles.container }>
          <p className={ styles.copyright }>© 2017 Canonical Ltd. Ubuntu and Canonical are registered trademarks of Canonical Ltd.</p>
          <p><a href="http://www.ubuntu.com/legal">Legal information</a> · <a href="https://github.com/canonical-ols/build.snapcraft.io/issues/new">Report a bug on this site</a></p>
        </div>
      </div>
    );
  }
}
