import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { HeadingThree } from '../vanilla-modules/heading/';
import styles from './help.css';

const HELP_CHANNELS_URL = 'https://docs.snapcraft.io/reference/channels';

export default class HelpPromoteSnap extends Component {
  render() {
    const { headline, name, revision, confinement } = this.props;

    const heading = headline || (confinement !== 'devmode'
      ? 'Ready to release to beta, candidate or stable?'
      : 'Ready to release to beta?');

    return (
      <div className={styles.helpWrapper}>
        <HeadingThree>{heading}</HeadingThree>
        <pre className={styles.pre}>
          <code className={ styles.cli }>
            snapcraft release {name} {revision} beta<br/>

            { confinement !== 'devmode' &&
              <span>
                snapcraft release {name} {revision} candidate<br/>
                snapcraft release {name} {revision} stable
              </span>
            }
          </code>
        </pre>

        { confinement === 'devmode' &&
          <p>
            To release to candidate or stable, you’ll need to stop using {' '}
            <code>
              <a
                className={ styles.external }
                href={ HELP_CHANNELS_URL }
                rel="noreferrer noopener"
                target="_blank"
              >confinement: devmode</a>
            </code>.
          </p>
        }
      </div>
    );
  }
}

HelpPromoteSnap.propTypes = {
  headline: PropTypes.string,
  name: PropTypes.string.isRequired,
  revision: PropTypes.number.isRequired,
  confinement: PropTypes.string
};
