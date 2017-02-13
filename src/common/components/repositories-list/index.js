import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { conf } from '../../helpers/config';
import { createSnap } from '../../actions/create-snap';
import RepositoryRow from '../repository-row';
import Spinner from '../spinner';
import { fetchUserSnaps } from '../../actions/snaps';
import { Table, THead, TBody, TR, TH } from '../vanilla/table';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

class RepositoriesList extends Component {

  componentDidMount() {
    const { authenticated } = this.props.auth;

    if (authenticated) {
      this.props.dispatch(fetchUserSnaps());
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
    return (
      <RepositoryRow
        key={ `snap_${fullName}` }
        snap={ snap }
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
      <div>
        { isLoading &&
          <div className={ spinnerStyles }>
            <Spinner />
          </div>
        }
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Configured</TH>
              <TH>Registered for publishing</TH>
              <TH>Latest build</TH>
            </TR>
          </THead>
          <TBody>
            { this.props.snaps.success &&
              this.props.snaps.snaps.map(this.renderRow.bind(this))
            }
          </TBody>
        </Table>
      </div>
    );
  }
}

RepositoriesList.propTypes = {
  snaps: PropTypes.object,
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    snaps
  } = state;

  return {
    auth,
    snaps
  };
}

export default connect(mapStateToProps)(RepositoriesList);
