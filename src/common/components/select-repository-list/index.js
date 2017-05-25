import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button, { LinkButton } from '../vanilla/button';
import { HeadingThree } from '../vanilla/heading';
import {
  fetchUserRepositories,
} from '../../actions/repositories';
import {
  addRepos,
  resetRepository,
  toggleRepositorySelection,
} from '../../actions/repository';
import {
  getEnabledRepositories,
  getSelectedRepositories,
  getReposToAdd,
  hasFailedRepositories,
  isAddingSnaps
} from '../../selectors/index.js';
import styles from './styles.css';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

export class SelectRepositoryListComponent extends Component {

  componentDidMount() {
    this.props.selectedRepositories && this.props.selectedRepositories.map(id => {
      this.props.dispatch(resetRepository(id));
    });
  }

  renderRepository(id) {
    const repository = this.props.entities.repos[id];
    const { fullName } = repository;

    const isRepoEnabled = !!this.props.enabledRepositories[id];

    return (
      <SelectRepositoryRow
        key={ `repo_${fullName}` }
        repository={ repository }
        onChange={ this.onSelectRepository.bind(this, id) }
        errorMsg={ repository.error && repository.error.message }
        isRepoEnabled={ isRepoEnabled }
      />
    );
  }

  onSelectRepository(id) {
    this.props.dispatch(toggleRepositorySelection(id));
  }

  handleAddRepositories() {
    const { reposToAdd, user } = this.props;

    // TODO else "You have not selected any repositories"
    if (reposToAdd.length) {
      this.props.dispatch(addRepos(reposToAdd, user.login));
    }
  }

  onPageLinkClick(pageNumber) {
    this.props.dispatch(fetchUserRepositories(pageNumber));
  }

  pageSlice(repositoriesIndex, pageLinks) {
    if (!pageLinks) {
      return repositoriesIndex;
    }

    const PAGE_SIZE = 30; // TODO move to config or state
    const { next, prev } = pageLinks;
    let page = [];

    if (next) {
      page = repositoriesIndex.slice((next - 2) * PAGE_SIZE, (next - 1) * PAGE_SIZE);
    } else if (prev) {
      page = repositoriesIndex.slice(prev * 30);
    }

    return page;
  }

  render() {
    const { user, selectedRepositories, isAddingSnaps, isUpdatingSnaps } = this.props;
    const { ids, error, isFetching, pageLinks } = this.props.repositories;
    const pagination = this.renderPageLinks(pageLinks);

    let renderedRepos = null;

    if (!error) {
      renderedRepos = this.pageSlice(ids, pageLinks)
        .map((id) => {
          return this.renderRepository(id);
        });
    } else {
      // TODO show error message and keep old repo list
    }

    const buttonSpinner = isFetching || isAddingSnaps || isUpdatingSnaps;

    return (
      <div>
        { isFetching &&
          <div className={ spinnerStyles }><Spinner /></div>
        }
        { renderedRepos }
        { pagination }
        <div className={ styles.footer }>
          <HeadingThree>
            { selectedRepositories.length } selected
          </HeadingThree>
          <div className={ styles['footer-right'] }>
            <div className={ styles['button-wrapper'] }>
              { ids && ids.length > 0 &&
                <LinkButton appearance="neutral" to={`/user/${user.login}`}>
                  Cancel
                </LinkButton>
              }
            </div>
            <div className={ styles['button-wrapper'] }>
              <Button
                appearance={ 'positive' }
                disabled={ !selectedRepositories.length || buttonSpinner }
                onClick={ this.handleAddRepositories.bind(this) }
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

  renderPageLinks(pageLinks) {
    if (pageLinks) {
      return (
        <div className={ styles['page-links-container'] }>
          <PageLinks { ...pageLinks } onClick={ this.onPageLinkClick.bind(this) } />
        </div>
      );
    }
  }
}

SelectRepositoryListComponent.propTypes = {
  dispatch: PropTypes.func.isRequired,
  entities: PropTypes.object.isRequired,
  onSelectRepository: PropTypes.func,
  repositories: PropTypes.object,
  user: PropTypes.object,
  repositoriesStatus: PropTypes.object,
  router: PropTypes.object.isRequired,
  selectedRepositories: PropTypes.array,
  reposToAdd: PropTypes.array,
  enabledRepositories: PropTypes.object,
  hasFailedRepositories: PropTypes.bool,
  isUpdatingSnaps: PropTypes.bool,
  isAddingSnaps: PropTypes.bool
};

function mapStateToProps(state) {
  const {
    user,
    entities,
    repositories,
  } = state;

  return {
    user,
    entities,
    repositories, // ?repository-pagination
    isUpdatingSnaps: state.snaps.isFetching,
    isAddingSnaps: isAddingSnaps(state),
    selectedRepositories: getSelectedRepositories(state),
    reposToAdd: getReposToAdd(state),
    enabledRepositories: getEnabledRepositories(state),
    hasFailedRepositories: hasFailedRepositories(state)
  };
}

export default connect(mapStateToProps)(withRouter(SelectRepositoryListComponent));
