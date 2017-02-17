import React, { Component, PropTypes } from 'react';

import { HeadingSix } from '../../vanilla/heading/';
import styles from './help-install-snap.css';

const HELP_INSTALL_URL = 'https://snapcraft.io/docs/core/install';

export default class HelpInstallSnap extends Component {
  render() {
    const { name, revision } = this.props;

    return (
      <div className={ styles.strip }>
        <HeadingSix>To test this build on your PC, cloud instance, or device:</HeadingSix>
        <div>
          <div className={ styles.cli }>
            sudo snap install --edge {name} --revision={revision}
          </div>
        </div>
        <p className={ styles.p }>The installation will not be auto-updated.</p>
        <p className={ styles.p }>Don’t have snapd installed? <a href={ HELP_INSTALL_URL }>Install it now</a>.</p>
      </div>
    );
  }
}

HelpInstallSnap.propTypes = {
  name: PropTypes.string.isRequired,
  revision: PropTypes.number.isRequired
};
