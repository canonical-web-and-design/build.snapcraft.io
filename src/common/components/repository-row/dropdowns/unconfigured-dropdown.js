import PropTypes from 'prop-types';
import React from 'react';
import url from 'url';

import { parseGitHubRepoUrl } from '../../../helpers/github-url';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

import templateYaml from './template-yaml.js';

import styles from './dropdowns.css';

const LEARN_THE_BASICS_LINK = 'https://docs.snapcraft.io/build-snaps/your-first-snap';
const INSTALL_IT_LINK = 'https://docs.snapcraft.io/build-snaps/';

const getTemplateUrl = (snap) => {
  const { fullName } = parseGitHubRepoUrl(snap.gitRepoUrl);
  const templateUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: `${fullName}/new/${snap.gitBranch}`,
    query: {
      'filename': 'snap/snapcraft.yaml',
      'value': templateYaml(snap.storeName)
    }
  });

  return templateUrl;
};

const UnconfiguredDropdown = (props) => {
  const { snap } = props;

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            This repo needs a snapcraft.yaml file,
            so that Snapcraft can make it buildable,
            installable, and runnable.
          </p>
          <p className={ styles.helpText }>
            <a
              href={ LEARN_THE_BASICS_LINK }
              target="_blank"
              rel="noreferrer noopener"
            >
              Learn the basics
            </a>,
            or {' '}
            <a
              href={ getTemplateUrl(snap) }
              target="_blank"
              rel="noreferrer noopener"
            >
              get started with a template
            </a>.
          </p>
          <p className={ styles.helpText }>
            Don’t have snapcraft? {' '}
            <a
              href={ INSTALL_IT_LINK }
              target="_blank"
              rel="noreferrer noopener"
            >
              Install it on your own PC
            </a>
            {' '} for testing.
          </p>
        </Data>
      </Row>
    </Dropdown>
  );
};

UnconfiguredDropdown.propTypes = {
  snap: PropTypes.shape({
    gitRepoUrl: PropTypes.string,
    gitBranch: PropTypes.string
  })
};

export default UnconfiguredDropdown;
