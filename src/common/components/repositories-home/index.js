import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchUserSnaps } from '../../actions/snaps';
import { fetchBuilds } from '../../actions/snap-builds';
import { LinkButton } from '../vanilla/button';
import { HeadingThree } from '../vanilla/heading';
import FirstTimeHeading from '../first-time-heading';
import RepositoriesList from '../repositories-list';
import styles from './repositories-home.css';
import Spinner from '../spinner';

// loading container styles not to duplicate .spinner class
import { spinner as spinnerStyles } from '../../containers/container.css';

let interval;
const SNAP_POLL_PERIOD = (15 * 1000);

class RepositoriesHome extends Component {
  fetchData(props) {
    const { snaps } = props;

    if (snaps.success) {
      // if user doesn't have enabled repos open add repositories view
      if (snaps.snaps.length === 0) {
        this.props.router.replace('/dashboard/select-repositories');
        return;
      }

      snaps.snaps.forEach((snap) => {
        this.props.dispatch(fetchBuilds(snap.git_repository_url, snap.self_link));
      });
    }
  }

  componentDidMount() {
    const { authenticated } = this.props.auth;
    const { dispatch } = this.props;
    const owner = this.props.user.login;

    if (authenticated) {
      dispatch(fetchUserSnaps(owner));
      if (!interval) {
        interval = setInterval(() => {
          dispatch(fetchUserSnaps(owner));
        }, SNAP_POLL_PERIOD);
      }
    }
  }

  componentWillUnmount() {
    clearInterval(interval);
    interval = null;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.snaps.success !== nextProps.snaps.success) {
      this.fetchData(nextProps);
    }
  }

  renderRepositoriesList() {
    const { snaps, snapBuilds } = this.props;

    return (
      <div>
        <FirstTimeHeading snaps={snaps} snapBuilds={snapBuilds} />
        <div className={ styles['button-container'] }>
          <HeadingThree>Repos to build and publish</HeadingThree>
          <div>
            <LinkButton appearance="neutral" to="/dashboard/select-repositories">
              Add repos…
            </LinkButton>
          </div>
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
    const hasSnaps = (snaps.snaps && Object.keys(snaps.snaps).length > 0);
    // show spinner until we know if user has any enabled repos
    return (snaps.isFetching && !hasSnaps)
      ? this.renderSpinner()
      : this.renderRepositoriesList();
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  user: PropTypes.object,
  snaps: PropTypes.object.isRequired,
  snapBuilds: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    user,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    user,
    snaps,
    snapBuilds
  };
}

export default connect(mapStateToProps)(withRouter(RepositoriesHome));
export const RepositoriesHomeRaw = RepositoriesHome;
