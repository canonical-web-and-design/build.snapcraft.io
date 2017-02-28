import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { conf } from '../../helpers/config';
import { createSnaps } from '../../actions/create-snap';
import { toggleRepository } from '../../actions/select-repositories-form';
import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button, { LinkButton } from '../vanilla/button';
import { HeadingThree } from '../vanilla/heading';
import { fetchUserRepositories } from '../../actions/repositories';
import { hasRepository } from '../../helpers/repositories';
import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

export class SelectRepositoryListComponent extends Component {

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
    const { fullName, enabled } = repo;
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
        isEnabled={ enabled }
      />
    );
  }

  onSelectRepository(repository) {
    this.props.dispatch(toggleRepository(repository));
  }

  onSubmit() {
    const { selectedRepos } = this.props.selectRepositoriesForm;
    if (selectedRepos.length) {
      this.props.dispatch(createSnaps(selectedRepos));
    }
  }

  onPageLinkClick(pageNumber) {
    this.props.dispatch(fetchUserRepositories(pageNumber));
  }

  filterEnabledRepos(repositories) {
    const { success, snaps } = this.props.snaps;

    if (success && snaps.length) {
      for (let i = repositories.length; i--;) {
        for (let j = snaps.length; j--;) {
          const enabledRepo = snaps[j].git_repository_url;

          if (enabledRepo === repositories[i].url) {
            repositories[i].enabled = true;
            break;
          } else {
            repositories[i].enabled = false;
          }
        }
      }
    }

    return repositories;
  }

  render() {
    const isLoading = this.props.repositories.isFetching;
    const { selectedRepos } = this.props.selectRepositoriesForm;
    const { repos, success } = this.props.repositories;
    const pageLinks = this.renderPageLinks.call(this);

    this.filterEnabledRepos(repos);
    let renderedRepos = null;

    if (success) {
      renderedRepos = this.props.repositories.repos.map(this.renderRepository.bind(this));
    }

    return (
      <div>
        { isLoading &&
          <div className={ spinnerStyles }><Spinner /></div>
        }
        { renderedRepos }
        { pageLinks }
        <div className={ styles.footer }>
          <HeadingThree>
            { selectedRepos.length } selected
          </HeadingThree>
          <div className={ styles['footer-right'] }>
            <div className={ styles['button-wrapper'] }>
              { repos && repos.length > 0 &&
                <LinkButton appearance="neutral" to="/dashboard">
                  Cancel
                </LinkButton>
              }
            </div>
            <div className={ styles['button-wrapper'] }>
              <Button onClick={ this.onSubmit.bind(this) } appearance={ 'positive' }>
                Add
              </Button>
            </div>
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

SelectRepositoryListComponent.propTypes = {
  snaps: PropTypes.object,
  repositories: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  selectRepositoriesForm: PropTypes.object,
  onSelectRepository: PropTypes.func,
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    snaps,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm
  } = state;

  return {
    snaps,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm
  };
}

export default connect(mapStateToProps)(withRouter(SelectRepositoryListComponent));
