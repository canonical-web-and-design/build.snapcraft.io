import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchBuilds } from '../../actions/snap-builds';
import { fetchUserRepositoriesAndSnaps } from '../../actions/repositories';
import SelectRepositoryList from '../select-repository-list';
import { HeadingThree } from '../vanilla/heading';
import FirstTimeHeading from '../first-time-heading';
import { CardHighlighted } from '../vanilla/card';
import PrivateReposInfo from '../private-repos-info';

import styles from './select-repositories-page.css';

class SelectRepositoriesPage extends Component {
  componentDidMount() {
    const { authenticated } = this.props.auth;
    const owner = this.props.user.login;

    if (authenticated) {
      this.props.dispatch(fetchUserRepositoriesAndSnaps(owner));
    }

    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.snaps.success !== nextProps.snaps.success) {
      this.fetchData(nextProps);
    }
  }

  render() {
    // TODO: bartaz refactor
    // XXX this should fetch snaps and repos and pass to children ?
    // should it fetch data for first time heading (or others?)
    // move it to HOC?

    return (
      <div>
        <FirstTimeHeading />
        <CardHighlighted>
          <HeadingThree className={ styles.heading }>
            Choose repos to add
          </HeadingThree>
          <PrivateReposInfo />
          <SelectRepositoryList/>
        </CardHighlighted>
      </div>
    );
  }

  fetchData(props) {
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
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    entities,
    user,
    snaps
  } = state;

  return {
    auth,
    entities,
    user,
    snaps
  };
}

export default connect(mapStateToProps)(SelectRepositoriesPage);
