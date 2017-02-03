import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { conf } from '../../helpers/config';
import { createSnap } from '../../actions/create-snap';
import { toggleRepository } from '../../actions/select-repositories-form';
import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button from '../button';
import { fetchUserRepositories } from '../../actions/repositories';
import { hasRepository } from '../../helpers/repositories';
import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

class SelectRepositoryList extends Component {

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
    const { selectedRepos } = this.props.selectRepositoriesForm;

    return (
      <SelectRepositoryRow
        key={ `repo_${repo.fullName}` }
        repository={ repo }
        buttonLabel={ status.isFetching ? 'Creating...' : 'Create' }
        buttonDisabled={ status.isFetching }
        onChange={ this.onSelectRepository.bind(this, repo) }
        errorMsg= { this.getErrorMessage(status.error) }
        checked={ hasRepository(selectedRepos, repo) }
      />
    );
  }

  onSelectRepository(repository) {
    this.props.dispatch(toggleRepository(repository));
  }

  onSubmit() {
    const { selectedRepos } = this.props.selectRepositoriesForm;
    if (selectedRepos.length) {
      // TODO: Switch to batched repository action
      this.props.dispatch(createSnap(selectedRepos[0].url));
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
            <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
          </div>
        }
        { isLoading &&
          <div className={ spinnerStyles }><Spinner /></div>
        }
        { this.props.repositories.success &&
          this.props.repositories.repos.map(this.renderRepository.bind(this))
        }
        <Button onClick={ this.onSubmit.bind(this) }>
          Enable repos
        </Button>
        { this.props.repositories.success && pageLinks &&
          <div className={ styles['page-links-container'] }>
            <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
          </div>
        }
      </div>
    );
  }
}

SelectRepositoryList.propTypes = {
  repositories: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  selectRepositoriesForm: PropTypes.object,
  onSelectRepository: PropTypes.func,
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    repositories,
    repositoriesStatus,
    selectRepositoriesForm,
    auth
  } = state;

  return {
    auth,
    repositories,
    selectRepositoriesForm,
    repositoriesStatus
  };
}

export default connect(mapStateToProps)(SelectRepositoryList);
