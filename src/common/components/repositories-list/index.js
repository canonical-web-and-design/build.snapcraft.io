import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { conf } from '../../helpers/config';
import {
  checkSignedIntoStore,
  getAccountInfo,
  getSSODischarge
} from '../../actions/auth-store';
import { createSnap } from '../../actions/create-snap';
import RepositoryRow from '../repository-row';
import Spinner from '../spinner';
import { Table, Head, Body, Row, Header } from '../vanilla/table-interactive';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';
import styles from './repositoriesList.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

class RepositoriesList extends Component {
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

  renderRow(snap) {
    const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);

    let latestBuild = null;
    const snapBuilds = this.props.snapBuilds[fullName];

    if (snapBuilds && snapBuilds.success && snapBuilds.builds.length) {
      latestBuild = snapBuilds.builds[0];
    }

    const registerNameStatus = this.props.registerName[fullName] || {};

    return (
      <RepositoryRow
        key={ `repo_${fullName}` }
        snap={ snap }
        latestBuild={ latestBuild }
        fullName={ fullName }
        authStore={ this.props.authStore }
        registerNameStatus={ registerNameStatus }
      />
    );
  }

  onButtonClick(repository) {
    if (repository) {
      this.props.dispatch(createSnap(repository.url));
    }
  }

  render() {
    const isLoading = this.props.snaps.isFetching;

    return (
      <div className={styles.repositoriesList}>
        { isLoading &&
          <div className={ spinnerStyles }>
            <Spinner />
          </div>
        }
        <Table>
          <Head>
            <Row>
              <Header col="30">Name</Header>
              <Header col="15">Configured</Header>
              <Header col="25">Registered for publishing</Header>
              <Header col="30">Latest build</Header>
            </Row>
          </Head>
          <Body>
            { this.props.snaps.success &&
              this.props.snaps.snaps.map(this.renderRow.bind(this))
            }
          </Body>
        </Table>
      </div>
    );
  }
}

RepositoriesList.propTypes = {
  auth: PropTypes.object.isRequired,
  authStore: PropTypes.object.isRequired,
  registerName: PropTypes.object,
  snaps: PropTypes.object,
  snapBuilds: PropTypes.object,
  dispatch: PropTypes.func.isRequired
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
    snapBuilds
  };
}

export default connect(mapStateToProps)(RepositoriesList);
