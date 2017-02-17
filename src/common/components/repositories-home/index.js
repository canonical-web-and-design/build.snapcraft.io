import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchUserSnaps } from '../../actions/snaps';
import { fetchBuilds } from '../../actions/snap-builds';
import { Anchor } from '../vanilla/button';
import RepositoriesList from '../repositories-list';
import styles from './repositories-home.css';

class RepositoriesHome extends Component {
  fetchData(props) {
    const { snaps } = props;

    if (snaps.success) {
      snaps.snaps.forEach((snap) => {
        this.props.dispatch(fetchBuilds(snap.git_repository_url, snap.self_link));
      });
    }
  }

  componentDidMount() {
    const { authenticated } = this.props.auth;
    const owner = this.props.user.login;

    if (authenticated) {
      this.props.dispatch(fetchUserSnaps(owner));
    }

    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.fetchData(nextProps);
  }

  render() {
    return (
      <div>
        <h2>Repos to build and publish</h2>
        <div className={ styles['button-container'] }>
          <Anchor appearance="neutral" href="dashboard/select-repositories/">
            Add new repository
          </Anchor>
        </div>
        <RepositoriesList />
      </div>
    );
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    user,
    snaps
  } = state;

  return {
    auth,
    user,
    snaps
  };
}

export default connect(mapStateToProps)(RepositoriesHome);
