import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import PageLinks from '../page-links';
import Button, { LinkButton } from '../vanilla/button';
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

import PrivateReposInfo from '../private-repos-info/private-repos-info';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

export class SelectRepositoryListComponent extends Component {

  constructor() {
    super();

    this.state = {
      showMissingReposInfo: false
    };
  }

  componentDidMount() {
    this.props.selectedRepositories && this.props.selectedRepositories.map(id => {
      this.props.dispatch(resetRepository(id));
    });

    // bind document click event
    if (typeof document !== 'undefined') {
      this.onBoundDocumentClick = this.onDocumentClick.bind(this);
      document.addEventListener('click', this.onBoundDocumentClick);
    }
  }

  componentWillUnmount() {
    // unbind document click event
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.onBoundDocumentClick);
    }
  }

  onDocumentClick() {
    this.setState({
      showMissingReposInfo: false
    });
  }

  onHelpClick(event) {
    // prevent help click from triggering document click
    event.nativeEvent.stopImmediatePropagation();

    this.setState({
      showMissingReposInfo: !this.state.showMissingReposInfo
    });
  }

  onMissingInfoClick(event) {
    // prevent info from closing when it's clicked
    event.nativeEvent.stopImmediatePropagation();
  }

  onRefreshClick() {
    this.setState({
      showMissingReposInfo: false
    });
    this.props.onRefresh();
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

  renderRepoList() {
    const { ids, error, isFetching, pageLinks } = this.props.repositories;

    if (isFetching) {
      return (
        <div className={ styles.spinnerWrapper }>
          <div className={ spinnerStyles }><Spinner /></div>
        </div>
      );
    }

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

    return (
      <div>
        { renderedRepos }
        { pagination }
      </div>
    );
  }

  render() {
    const { user, selectedRepositories, isAddingSnaps, isUpdatingSnaps } = this.props;
    const { isFetching } = this.props.repositories;

    const buttonSpinner = isFetching || isAddingSnaps || isUpdatingSnaps;

    return (
      <div>
        <div className={ styles.repoList }>
          { this.state.showMissingReposInfo
            ? (
              <PrivateReposInfo
                user={user}
                onRefreshClick={this.onRefreshClick.bind(this)}
                onClick={this.onMissingInfoClick.bind(this)}
              />
            )
            : this.renderRepoList()
          }
        </div>
        <div className={ styles.footer }>
          { this.state.showMissingReposInfo &&
            <div className={ styles.arrow } />
          }
          <div className={ styles.summary }>
            <strong>
              { selectedRepositories.length } selected
            </strong>
            {' '}
            (<a href="#" onClick={this.onHelpClick.bind(this)}>
              { this.state.showMissingReposInfo ? 'Return to repos list' : 'Anything missing?' }
            </a>)
          </div>
          <div>
            <LinkButton appearance="base" to={`/user/${user.login}`}>
              Cancel
            </LinkButton>
            {' '}
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
    );
  }

  renderPageLinks(pageLinks) {
    const hasPagination = !!(pageLinks && (pageLinks.first || pageLinks.last));

    if (hasPagination) {
      return (
        <div className={ styles.pageLinksContainer }>
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
  isAddingSnaps: PropTypes.bool,
  onRefresh: PropTypes.func
};

function mapStateToProps(state, ownProps) {
  const {
    user,
    entities,
    repositories,
  } = state;

  return {
    onRefresh: ownProps.onRefresh,
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
