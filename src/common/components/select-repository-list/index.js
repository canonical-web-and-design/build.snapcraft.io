import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { conf } from '../../helpers/config';
import {
  checkSignedIntoStore,
  getSSODischarge,
  signIntoStore
} from '../../actions/auth-store';
import { createSnaps } from '../../actions/create-snap';
import { toggleRepository } from '../../actions/select-repositories-form';
import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button from '../vanilla/button';
import { fetchUserRepositories } from '../../actions/repositories';
import { hasRepository } from '../../helpers/repositories';
import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

class SelectRepositoryList extends Component {

  componentDidMount() {
    if (this.props.authStore.hasDischarge) {
      this.props.dispatch(getSSODischarge());
    } else if (this.props.authStore.authenticated === null) {
      this.props.dispatch(checkSignedIntoStore());
    }
  }

  componentWillReceiveProps(nextProps) {
    const repositoriesStatus = nextProps.repositoriesStatus;
    const ids = Object.keys(repositoriesStatus);
    if (ids.length && ids.every((id) => repositoriesStatus[id].success)) {
      this.props.router.push('/dashboard');
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
    if (this.props.authStore.authenticated) {
      const { selectedRepos } = this.props.selectRepositoriesForm;
      if (selectedRepos.length) {
        this.props.dispatch(createSnaps(selectedRepos));
      }
    } else {
      this.props.dispatch(signIntoStore());
    }
  }

  onPageLinkClick(pageNumber) {
    this.props.dispatch(fetchUserRepositories(pageNumber));
  }

  render() {
    const isLoading = this.props.repositories.isFetching;
    // If the user has signed into the store but we haven't fetched the
    // resulting discharge macaroon, we need to wait for that before
    // allowing them to proceed.
    const submitButtonDisabled = (
      this.props.authStore.hasDischarge &&
      !this.props.authStore.authenticated
    );

    return (
      <div>
        { this.renderPageLinks.call(this) }
        { isLoading &&
          <div className={ spinnerStyles }><Spinner /></div>
        }
        { this.props.repositories.success &&
          this.props.repositories.repos.map(this.renderRepository.bind(this))
        }
        { this.renderPageLinks.call(this) }
        <div className={ styles.footer }>
          <div className={ styles.right }>
            <Button disabled={ submitButtonDisabled } onClick={ this.onSubmit.bind(this) } appearance={ 'positive' }>
              Add
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderPageLinks() {
    const pageLinks = this.props.repositories.pageLinks;
    if (this.props.repositories.success && pageLinks) {
      return (
        <div className={ styles['page-links-container'] }>
          <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
        </div>
      );
    }
  }
}

SelectRepositoryList.propTypes = {
  repositories: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  selectRepositoriesForm: PropTypes.object,
  onSelectRepository: PropTypes.func,
  authStore: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    authStore,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm
  } = state;

  return {
    authStore,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm
  };
}

export default connect(mapStateToProps)(withRouter(SelectRepositoryList));
