import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { hasNoRegisteredNames, hasNoConfiguredSnaps } from '../../selectors';
import { conf } from '../../helpers/config';
import {
  checkSignedIntoStore,
  getAccountInfo,
  getSSODischarge
} from '../../actions/auth-store';
import RepositoryRow from '../repository-row';
import { Table, Head, Body, Row, Header } from '../vanilla/table-interactive';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

import styles from './repositoriesList.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

export class RepositoriesListView extends Component {

  fetchAuthData(authStore) {
    if (authStore.authenticated === null) {
      this.props.dispatch(checkSignedIntoStore());
    } else if (authStore.hasShortNamespace === null) {
      this.props.dispatch(getAccountInfo(authStore.userName));
    }
  }

  componentDidMount() {
    if (this.props.authStore.hasDischarge) {
      this.props.dispatch(getSSODischarge());
    } else {
      this.fetchAuthData(this.props.authStore);
    }
  }

  componentWillReceiveProps(nextProps) {
    const authStore = this.props.authStore;
    const nextAuthStore = nextProps.authStore;
    if (authStore.authenticated !== nextAuthStore.authenticated ||
        authStore.hasShortNamespace !== nextAuthStore.hasShortNamespace) {
      this.fetchAuthData(nextAuthStore);
    }
  }

  getSnapNotRegisteredMessage(snapName) {
    const devportalUrl = conf.get('STORE_DEVPORTAL_URL');
    const registerNameUrl = `${devportalUrl}/click-apps/register-name/` +
                            `?name=${encodeURIComponent(snapName)}`;

    return <span>
      The name provided in the snapcraft.yaml file ({snapName}) is not
      registered in the store.
      Please <a href={registerNameUrl}>register it</a> before trying
      again.
    </span>;
  }

  getErrorMessage(error) {
    if (error) {
      const payload = error.json.payload;
      if (payload.code === SNAP_NAME_NOT_REGISTERED_ERROR_CODE) {
        return this.getSnapNotRegisteredMessage(payload.snap_name);
      } else {
        return error.message;
      }
    }
  }

  renderRow(snap, index) {
    const { hasNoConfiguredSnaps, hasNoRegisteredNames, registerName, snapBuilds, authStore } = this.props;
    const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);
    const isFirstInList = index === 0;

    let registerNameIsOpen = false;
    let configureIsOpen = false;

    if (isFirstInList) {
      registerNameIsOpen = hasNoRegisteredNames;
      configureIsOpen = registerNameIsOpen ? false : hasNoConfiguredSnaps;
    }

    let latestBuild = null;
    const currentSnapBuilds = snapBuilds[fullName];

    if (currentSnapBuilds && currentSnapBuilds.success && currentSnapBuilds.builds.length) {
      latestBuild = currentSnapBuilds.builds[0];
    }

    const registerNameStatus = registerName[fullName] || {};

    return (
      <RepositoryRow
        key={ `repo_${fullName}` }
        snap={ snap }
        latestBuild={ latestBuild }
        fullName={ fullName }
        authStore={ authStore }
        registerNameStatus={ registerNameStatus }
        registerNameIsOpen={ registerNameIsOpen }
        configureIsOpen={ configureIsOpen }
      />
    );
  }

  render() {
    const { snaps } = this.props.snaps;
    const hasSnaps = (snaps && Object.keys(snaps).length > 0);

    return (
      <div className={styles.repositoriesList}>
        <Table>
          <Head>
            <Row>
              <Header col="27">Name</Header>
              <Header col="15">Configured</Header>
              <Header col="25">Registered for publishing</Header>
              <Header col="30">Latest build</Header>
            </Row>
          </Head>
          <Body>
            { hasSnaps &&
              snaps.map(this.renderRow.bind(this))
            }
          </Body>
        </Table>
      </div>
    );
  }
}

RepositoriesListView.defaultProps = {
  auth: {},
  authStore: {},
  hasNoConfiguredSnaps: true,
  hasNoRegisteredNames: true,
  registerName: {},
  snapBuilds: {},
  snaps: {}
};

RepositoriesListView.propTypes = {
  auth: PropTypes.object.isRequired,
  authStore: PropTypes.object.isRequired,
  dispatch: PropTypes.func,
  hasNoConfiguredSnaps: PropTypes.bool,
  hasNoRegisteredNames: PropTypes.bool,
  registerName: PropTypes.object,
  snapBuilds: PropTypes.object,
  snaps: PropTypes.object
};

function mapStateToProps(state) {
  const {
    auth,
    authStore,
    registerName,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    authStore,
    registerName,
    snaps,
    snapBuilds,
    hasNoRegisteredNames: hasNoRegisteredNames(state),
    hasNoConfiguredSnaps: hasNoConfiguredSnaps(state)
  };
}

export default connect(mapStateToProps)(RepositoriesListView);
