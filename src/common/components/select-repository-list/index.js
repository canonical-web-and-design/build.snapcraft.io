import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { conf } from '../../helpers/config';
import { createSnaps, createSnapsClear } from '../../actions/create-snap';
import {
  toggleRepository,
  unselectAllRepositories
} from '../../actions/select-repositories-form';
import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button, { LinkButton } from '../vanilla/button';
import { HeadingThree } from '../vanilla/heading';
import { fetchUserRepositories } from '../../actions/repositories';
import { hasRepository, hasSnapForRepository } from '../../helpers/repositories';
import { isAddingSnaps } from '../../selectors';

import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

const SNAP_NAME_NOT_REGISTERED_ERROR_CODE = 'snap-name-not-registered';

export class SelectRepositoryListComponent extends Component {

  componentDidMount() {
    this.props.dispatch(createSnapsClear());
    this.props.dispatch(unselectAllRepositories());
  }

  componentWillReceiveProps(nextProps) {
    const user = this.props.user;
    const repositoriesStatus = nextProps.repositoriesStatus;
    const ids = Object.keys(repositoriesStatus);
    if (ids.length && ids.every((id) => repositoriesStatus[id].success)) {
      this.props.router.push(`/user/${user.login}`);
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
    const { repositoriesStatus, selectRepositoriesForm, snaps } = this.props;
    const { fullName } = repo;
    const status = repositoriesStatus[fullName] || {};

    const selected = hasRepository(selectRepositoriesForm.selectedRepos, repo);
    const enabled = snaps.success && hasSnapForRepository(snaps.snaps, repo);

    return (
      <SelectRepositoryRow
        key={ `repo_${repo.fullName}` }
        repository={ repo }
        onChange={ this.onSelectRepository.bind(this, repo) }
        errorMsg= { this.getErrorMessage(status.error) }
        // row is checked if repo is already enabled or selected by user
        checked={ selected || enabled }
        // input is disabled when repo is already enabled or snaps are being added
        disabled={ enabled || this.props.isAddingSnaps }
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

  render() {
    const { user, isAddingSnaps } = this.props;
    const isLoading = this.props.repositories.isFetching;
    const { selectedRepos } = this.props.selectRepositoriesForm;
    const { repos, success } = this.props.repositories;
    const pageLinks = this.renderPageLinks.call(this);

    let renderedRepos = null;

    if (success) {
      renderedRepos = this.props.repositories.repos.map(this.renderRepository.bind(this));
    }

    const buttonSpinner = isLoading || isAddingSnaps;

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
                <LinkButton appearance="neutral" to={`/user/${user.login}`}>
                  Cancel
                </LinkButton>
              }
            </div>
            <div className={ styles['button-wrapper'] }>
              <Button
                appearance={ 'positive' }
                disabled={ !selectedRepos.length || buttonSpinner }
                onClick={ this.onSubmit.bind(this) }
                isSpinner={buttonSpinner}
              >
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
  user: PropTypes.object,
  snaps: PropTypes.object,
  repositories: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  selectRepositoriesForm: PropTypes.object,
  isAddingSnaps: PropTypes.bool,
  onSelectRepository: PropTypes.func,
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    user,
    snaps,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm
  } = state;

  return {
    user,
    snaps,
    repositories,
    repositoriesStatus,
    selectRepositoriesForm,
    isAddingSnaps: isAddingSnaps(state)
  };
}

export default connect(mapStateToProps)(withRouter(SelectRepositoryListComponent));
