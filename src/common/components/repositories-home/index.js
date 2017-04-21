import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { hasSnaps } from '../../selectors';
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
    const { hasSnaps, snaps, entities } = props;

    // check both success and fetching to avoid redirecting
    // based on previous success
    if (snaps.success && !snaps.isFetching) {
      // if user doesn't have enabled repos open add repositories view
      if (!hasSnaps) {
        this.props.router.replace('/select-repositories');
        return;
      }

      snaps.ids.forEach((id) => {
        const snap = entities.snaps[id];
        this.props.fetchBuilds(snap.gitRepoUrl, snap.selfLink);
      });
    }
  }

  componentDidMount() {
    const { authenticated } = this.props.auth;
    const { updateSnaps } = this.props;
    const owner = this.props.user.login;

    if (authenticated) {
      updateSnaps(owner);
      if (!interval) {
        interval = setInterval(() => {
          updateSnaps(owner);
        }, SNAP_POLL_PERIOD);
      }
    }
  }

  componentWillUnmount() {
    clearInterval(interval);
    interval = null;
  }

  componentWillReceiveProps(nextProps) {
    const snapsLength = nextProps.snaps.ids.length;

    if ((this.props.snaps.success !== nextProps.snaps.success)
        || (snapsLength === 0)) {
      this.fetchData(nextProps);
    }
  }

  renderRepositoriesList() {
    // TODO: bartaz refactor
    // should it fetch data for first time heading (it already does need it anyway probably)
    // move it to HOC?

    return (
      <div>
        <FirstTimeHeading isOnMyRepos={true} />
        <div className={ styles['button-container'] }>
          <HeadingThree>Repos to build and publish</HeadingThree>
          <div>
            <LinkButton appearance="neutral" to="/select-repositories">
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
    // show spinner if snaps data was not yet fetched (snaps list is empty)
    // (to avoid spinner during polling we are not checking `success` or `isFetching`
    //
    // when snaps are loaded and user doesn't have any, they will be redirected
    // to select repositories (so spinner won't be showing endlessly)
    return !this.props.hasSnaps
      ? this.renderSpinner()
      : this.renderRepositoriesList();
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  user: PropTypes.object,
  entities: PropTypes.object,
  snaps: PropTypes.object.isRequired,
  snapBuilds: PropTypes.object.isRequired,
  hasSnaps: PropTypes.bool,
  router: PropTypes.object.isRequired,
  updateSnaps: PropTypes.func.isRequired,
  fetchBuilds: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    auth,
    user,
    entities,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    user,
    entities,
    snaps,
    snapBuilds,
    hasSnaps: hasSnaps(state)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSnaps: (owner) => {
      dispatch(fetchUserSnaps(owner));
    },
    fetchBuilds: (repositoryUrl, snapLink) => {
      dispatch(fetchBuilds(repositoryUrl, snapLink));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(RepositoriesHome));
export const RepositoriesHomeRaw = RepositoriesHome;
