import React, { Component, PropTypes } from 'react';

import { HeadingThree } from '../../vanilla/heading/';
import styles from './help-install-snap.css';

const HELP_INSTALL_URL = 'https://snapcraft.io/docs/core/install';

export default class HelpInstallSnap extends Component {
  render() {
    const { headline, name, revision } = this.props;
    const revOption = revision ? `--revision=${ revision }` : '';

    return (
      <div className={ styles.strip }>
        <HeadingThree>{ headline }</HeadingThree>
        <pre>
          <code className={ styles.cli }>
            sudo snap install --edge { name } { revOption }
          </code>
        </pre>
        <p className={ styles.p }>The installed snap will not be auto-updated.</p>
        <p className={ styles.p }>
          Don’t have snapd installed? <a className={ styles.external } href={ HELP_INSTALL_URL }>Install it now</a>.
        </p>
      </div>
    );
  }
}

HelpInstallSnap.propTypes = {
  headline: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  revision: PropTypes.number
};
