import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchBuilds } from '../../actions/snap-builds';
import { fetchUserRepositoriesAndSnaps, searchRepos } from '../../actions/repositories';
import { fetchUserOrganizations } from '../../actions/organizations';
import SelectRepositoryList from '../select-repository-list';
import { HeadingThree } from '../vanilla/heading';
import FirstTimeHeading from '../first-time-heading';
import SearchInput from '../search-input';

import styles from './select-repositories-page.css';

class SelectRepositoriesPage extends Component {

  componentDidMount() {
    this.fetchUserData();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.snaps.success !== nextProps.snaps.success) {
      this.fetchBuilds(nextProps);
    }
  }

  updateSearch(event) {
    this.props.dispatch(searchRepos(event.target.value));
  }

  render() {
    // TODO: bartaz refactor
    // XXX this should fetch snaps and repos and pass to children ?
    // should it fetch data for first time heading (or others?)
    // move it to HOC?

    return (
      <div>
        <FirstTimeHeading />
        <div className={styles.selectRepositoriesBox}>
          <div className={styles.selectRepositoriesHeading}>
            <HeadingThree className={ styles.heading }>
              Add repos
            </HeadingThree>
            <SearchInput
              id="search-repos"
              value={ this.props.searchTerm }
              onChange={ this.updateSearch.bind(this) }
            />
          </div>
          <SelectRepositoryList
            onRefresh={ this.onRefresh.bind(this) }
          />
        </div>
      </div>
    );
  }

  onRefresh() {
    this.fetchUserData();
  }

  fetchUserData() {
    const { authenticated } = this.props.auth;
    const owner = this.props.user.login;

    if (authenticated) {
      this.props.dispatch(fetchUserOrganizations(owner));
      this.props.dispatch(fetchUserRepositoriesAndSnaps(owner));
    }

    this.fetchBuilds(this.props);
  }

  fetchBuilds(props) {
    const { snaps } = props;

    if (snaps.success) {
      snaps.ids.forEach((id) => {
        const snap = props.entities.snaps[id];
        this.props.dispatch(fetchBuilds(snap.gitRepoUrl, snap.selfLink));
      });
    }
  }
}

SelectRepositoriesPage.propTypes = {
  auth: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  user: PropTypes.object,
  snaps: PropTypes.object.isRequired,
  searchTerm: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    entities,
    user,
    snaps,
    repositories
  } = state;

  return {
    auth,
    entities,
    user,
    snaps,
    searchTerm: repositories.searchTerm
  };
}

export default connect(mapStateToProps)(SelectRepositoriesPage);
