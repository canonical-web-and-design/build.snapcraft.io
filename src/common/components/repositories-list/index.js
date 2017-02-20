import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { conf } from '../../helpers/config';
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

    return (
      <RepositoryRow
        key={ `repo_${fullName}` }
        snap={ snap }
        latestBuild={ latestBuild }
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
              <Header col="20">Configured</Header>
              <Header col="20">Registered for publishing</Header>
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
  snaps: PropTypes.object,
  snapBuilds: PropTypes.object,
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    snaps,
    snapBuilds
  };
}

export default connect(mapStateToProps)(RepositoriesList);
