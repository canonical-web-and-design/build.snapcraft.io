import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  hasSnaps,
  hasNoRegisteredNames,
  hasNoConfiguredSnaps
} from '../../selectors';
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
    const registerNameUrl = `${devportalUrl}/snaps/register-name/` +
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

  renderRow(id, index) {
    const snap = this.props.entities.snaps[id];
    const { hasNoConfiguredSnaps, hasNoRegisteredNames, snapBuilds, authStore } = this.props;
    const { fullName } = parseGitHubRepoUrl(snap.gitRepoUrl);
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

    const registerNameStatus = snap.registerNameStatus || {};

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
    const { ids } = this.props.snaps;

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
            { this.props.hasSnaps &&
              ids.map(this.renderRow.bind(this))
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
  entities: {},
  hasNoConfiguredSnaps: true,
  hasNoRegisteredNames: true,
  snapBuilds: {},
  snaps: {}
};

RepositoriesListView.propTypes = {
  auth: PropTypes.object.isRequired,
  authStore: PropTypes.object.isRequired,
  entities: PropTypes.shape({
    snaps: PropTypes.object
  }),
  dispatch: PropTypes.func,
  hasSnaps: PropTypes.bool,
  hasNoConfiguredSnaps: PropTypes.bool,
  hasNoRegisteredNames: PropTypes.bool,
  snapBuilds: PropTypes.object,
  snaps: PropTypes.object
};

function mapStateToProps(state) {
  const {
    auth,
    authStore,
    entities,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    authStore,
    entities,
    snaps,
    snapBuilds,
    hasSnaps: hasSnaps(state),
    hasNoRegisteredNames: hasNoRegisteredNames(state),
    hasNoConfiguredSnaps: hasNoConfiguredSnaps(state)
  };
}

export default connect(mapStateToProps)(RepositoriesListView);
