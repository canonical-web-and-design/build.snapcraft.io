import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { conf } from '../../helpers/config';
import { createSnap } from '../../actions/create-snap';
import RepositoryRow from '../repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import { fetchUserRepositories } from '../../actions/repositories';
import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

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

  renderRepository(repo) {
    const { fullName } = repo;
    const status = this.props.repositoriesStatus[fullName] || {};

    return (
      <RepositoryRow
        key={ `repo_${repo.fullName}` }
        repository={ repo }
        buttonLabel={ status.isFetching ? 'Creating...' : 'Create' }
        buttonDisabled={ status.isFetching }
        onButtonClick={ this.onButtonClick.bind(this, repo) }
        errorMsg= { this.getErrorMessage(status.error) }
      />
    );
  }

  onButtonClick(repository) {
    if (repository) {
      this.props.dispatch(createSnap(repository.url));
    }
  }

  onPageLinkClick(pageNumber) {
    this.props.dispatch(fetchUserRepositories(pageNumber));
  }

  render() {
    const isLoading = this.props.repositories.isFetching;
    const pageLinks = this.props.repositories.pageLinks;

    return (
      <div>
        { this.props.repositories.success && pageLinks &&
          <div className={ styles['page-links-container'] }>
            Pages: <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
          </div>
        }
        { isLoading &&
          <div className={ spinnerStyles }>
            <Spinner />
          </div>
        }
        { this.props.repositories.success &&
          this.props.repositories.repos.map(this.renderRepository.bind(this))
        }
        { this.props.repositories.success && pageLinks &&
          <div className={ styles['page-links-container'] }>
            Pages: <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
          </div>
        }
      </div>
    );
  }
}

RepositoriesList.propTypes = {
  repositories: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    repositories,
    repositoriesStatus,
    auth
  } = state;

  return {
    auth,
    repositories,
    repositoriesStatus
  };
}

export default connect(mapStateToProps)(RepositoriesList);
