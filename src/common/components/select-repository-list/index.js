import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import SelectRepositoryRow from '../select-repository-row';
import Spinner from '../spinner';
import Button, { LinkButton } from '../vanilla/button';
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
  isAddingSnaps,
  getFilteredRepos
} from '../../selectors';
import styles from './styles.css';

import PrivateReposInfo from '../private-repos-info/private-repos-info';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

export class SelectRepositoryListComponent extends Component {

  constructor() {
    super();

    this.state = {
      showMissingReposInfo: false,
      addTriggered: false,
    };
  }

  componentDidMount() {
    this.props.selectedRepositories && this.props.selectedRepositories.map(id => {
      this.props.dispatch(resetRepository(id));
    });
  }

  componentWillUnmount() {
    // unbind document click event
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.onBoundDocumentClick);
    }
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

    if (reposToAdd.length) {
      this.setState({
        addTriggered: true,
      });
      this.props.dispatch(addRepos(reposToAdd, user.login));
    }
  }

  renderRepoList() {
    const { ids, error, isFetching, isDelayed } = this.props.repositories;
    const { filteredRepos } = this.props;

    if (isFetching && ids.length === 0) {
      return (
        <div className={ styles.spinnerWrapper }>
          { isDelayed &&
            <div className={ spinnerStyles }><Spinner /></div>
          }
        </div>
      );
    }

    let renderedRepos = null;

    if (!error) {
      renderedRepos = filteredRepos.map((id) => this.renderRepository(id));
    } else {
      // TODO show error message and keep old repo list
    }

    return renderedRepos;
  }

  renderRepoAmount() {
    const { ids, isFetching, searchTerm } = this.props.repositories;
    const { selectedRepositories, filteredRepos } = this.props;

    // Return nothing until isFetching completes
    if (isFetching || ids.length === 0) {
      return;
    }

    // Variables required to calucatate selected amount and filterd amount.
    let reposSelected = '';
    let reposFiltered = '';

    // Set reposSelected to value amount of selectedRepositories
    if (selectedRepositories.length > 0) {
      reposSelected = `${ selectedRepositories.length } selected`;
    }

    // Set reposFiltered message dependant on value of searchTerm
    if (searchTerm) {

      if (filteredRepos.length === 0) {

        if (reposSelected) {
          reposFiltered = ', no matches in ';
        } else {
          reposFiltered = 'No matches in ';
        }

      } else {

        if (filteredRepos.length === 1) {
          reposFiltered = '1 match in ';
        } else {
          reposFiltered = `${filteredRepos.length} matches in `;
        }

        if (reposSelected) {
          reposSelected += ', ';
        }
      }
    } else {
      if (reposSelected) {
        reposSelected += ' of ';
      }
    }

    // Repo total and overall status text variables
    let reposTotal = `${ ids.length } repos`;
    let reposStatus = `${reposSelected}${reposFiltered}${reposTotal}`;

    // Return selected repos amount and the total
    return (
      <strong>{ reposStatus }</strong>
    );
  }

  render() {
    const { user, selectedRepositories, isAddingSnaps, isUpdatingSnaps } = this.props;

    const buttonSpinner = this.state.addTriggered && (isAddingSnaps || isUpdatingSnaps);

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
            { this.renderRepoAmount() }
            {'\u00A0'}
            (<Button appearance={ 'link' } onClick={this.onHelpClick.bind(this)}>
              { this.state.showMissingReposInfo ? 'Return to repos list' : 'Any missing?' }
            </Button>)
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
  filteredRepos: PropTypes.array,
  onRefresh: PropTypes.func
};

function mapStateToProps(state, ownProps) {
  const {
    user,
    entities,
    repositories
  } = state;

  return {
    onRefresh: ownProps.onRefresh,
    user,
    entities,
    repositories, // ?repository-pagination
    isUpdatingSnaps: state.snaps.isFetching,
    filteredRepos: getFilteredRepos(state),
    isAddingSnaps: isAddingSnaps(state),
    selectedRepositories: getSelectedRepositories(state),
    reposToAdd: getReposToAdd(state),
    enabledRepositories: getEnabledRepositories(state),
    hasFailedRepositories: hasFailedRepositories(state)
  };
}

export default connect(mapStateToProps)(withRouter(SelectRepositoryListComponent));
