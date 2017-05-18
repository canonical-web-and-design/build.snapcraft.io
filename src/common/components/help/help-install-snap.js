import React, { Component, PropTypes } from 'react';

import { CopyToClipboard } from '../share';
import { HeadingThree } from '../vanilla/heading/';
import styles from './help.css';

const HELP_INSTALL_URL = 'https://snapcraft.io/docs/core/install';

export default class HelpInstallSnap extends Component {
  render() {
    const { children, headline, name, revision } = this.props;
    const revOption = revision ? `--revision=${ revision }` : '';
    const command = children || `sudo snap install --edge ${name} ${revOption}`;

    /**
    // TODO more at https://github.com/canonical-ols/build.snapcraft.io/issues/655
    const tweet = `Install ${name} in seconds on Linux OSes:\n`
      + `sudo snap install ${name}\n\n`
      + '(Don’t have snapd? https://snapcraft.io/docs/core/install)';
     **/

    return (
      <div className={styles.helpWrapper}>
        <HeadingThree>{ headline }</HeadingThree>
        <pre>
          <code className={ styles.cli }>
            {command}
          </code>
        </pre>
        { revision &&
          <p className={ styles.p }>
            The installed snap will not be auto-updated.
          </p>
        }
        <p className={ styles.snapdLink }>
          (
          <a
            className={ styles.external }
            href={ HELP_INSTALL_URL }
            rel="noreferrer noopener"
            target="_blank"
          >
            Don’t have snapd installed?
          </a>
          )
        </p>
        <div>
          <CopyToClipboard
            copyme={ command }
          />
          {/*
          <Tweet
            text={ tweet }
          />
          */}
        </div>
      </div>
    );
  }
}

HelpInstallSnap.propTypes = {
  headline: PropTypes.string.isRequired,
  // name is only required if there is no children specified
  name: (props, propName, componentName) => {
    if (typeof props.children === 'undefined' && typeof props[propName] !== 'string') {
      return new Error(`The prop '${propName}' in ${componentName} should be a string if no children are specified.`);
    }
  },
  revision: PropTypes.number,
  children: PropTypes.node
};
