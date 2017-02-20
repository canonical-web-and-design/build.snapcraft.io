import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchUserSnaps } from '../../actions/snaps';
import { fetchBuilds } from '../../actions/snap-builds';
import { Anchor } from '../vanilla/button';
import RepositoriesList from '../repositories-list';
import styles from './repositories-home.css';
import Spinner from '../spinner';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

class RepositoriesHome extends Component {
  fetchData(props) {
    const { snaps } = props;

    if (snaps.success) {
      // if user doesn't have enabled repos open add repositories view
      if (snaps.snaps.length === 0) {
        this.props.router.replace('/dashboard/select-repositories');
      }

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

  renderRepositoriesList() {
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

  renderSpinner() {
    return (
      <div className={ spinnerStyles }>
        <Spinner />
      </div>
    );
  }

  render() {
    const { snaps } = this.props;
    // show spinner until we know if user has any enabled repos
    return (snaps.success || snaps.error)
        ? this.renderRepositoriesList()
        : this.renderSpinner();
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  user: PropTypes.object,
  snaps: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired
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

export default connect(mapStateToProps)(withRouter(RepositoriesHome));
