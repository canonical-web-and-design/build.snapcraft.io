import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { hasSnaps } from '../../selectors';
import { fetchUserSnaps } from '../../actions/snaps';
import { fetchBuilds } from '../../actions/snap-builds';
import { LinkButton } from '../vanilla-modules/button';
import { HeadingThree } from '../vanilla-modules/heading';
import Notification from '../vanilla-modules/notification';
import FirstTimeHeading from '../first-time-heading';
import RepositoriesList from '../repositories-list';
import styles from './repositories-home.css';

let interval;
const SNAP_POLL_PERIOD = (30 * 1000);

class RepositoriesHome extends Component {

  updateBuilds(props) {
    const { snaps, entities } = props;
    snaps.ids.forEach((id) => {
      const snap = entities.snaps[id];
      this.props.fetchBuilds(snap.gitRepoUrl, snap.selfLink);
    });
  }

  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      const { authenticated } = this.props.auth;
      const { updateSnaps } = this.props;
      const owner = this.props.user.login;
      const now = Date.now();

      const delay = now - this.snapsUpdatedTimestamp;

      // only fetch if enough time has passed
      if (authenticated && delay > SNAP_POLL_PERIOD) {
        updateSnaps(owner);
      }
    }
  }

  componentDidMount() {
    const { authenticated } = this.props.auth;
    const { updateSnaps } = this.props;
    const owner = this.props.user.login;

    if (authenticated) {
      this.snapsUpdatedTimestamp = Date.now();
      updateSnaps(owner);
      if (!interval) {
        interval = setInterval(() => {
          const isVisible = (!document.visibilityState || document.visibilityState == 'visible');
          const { isSessionExpired } = this.props;

          // don't fetch snaps (and builds) if page is in the background
          // or if user session has expired
          if (isVisible && !isSessionExpired) {
            this.snapsUpdatedTimestamp = Date.now();
            updateSnaps(owner);
          }
        }, SNAP_POLL_PERIOD);

        // but update snaps when page becomes visible
        this.onBoundDocumentVisibilityChange = this.onVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.onBoundDocumentVisibilityChange);
      }
    }
  }

  componentWillUnmount() {
    clearInterval(interval);
    interval = null;
    document.removeEventListener('visibilitychange', this.onBoundDocumentVisibilityChange);
  }

  componentWillReceiveProps(nextProps) {
    const { hasSnaps, snaps } = nextProps;
    // if snaps stopped fetching
    if ((this.props.snaps.isFetching !== snaps.isFetching) && !snaps.isFetching) {
      // if user has snaps update their build status
      if (hasSnaps) {
        this.updateBuilds(nextProps);
      }
    }
  }

  renderRepositoriesList() {
    // TODO: bartaz refactor
    // should it fetch data for first time heading (it already does need it anyway probably)
    // move it to HOC?

    let errorNotification = null;
    const { error } = this.props.snaps;

    if (error) {
      const message = (error.json && error.json.payload)
        ? error.json.payload.message
        : 'There was an error completing your request, please try again later.';
      errorNotification = (
        <Notification appearance='negative'>{ message }</Notification>
      );
    }

    return (
      <div>
        <FirstTimeHeading isOnMyRepos={true} />
        { errorNotification }
        <div className={ styles['button-container'] }>
          <HeadingThree>Repos to build</HeadingThree>
          <div>
            <LinkButton appearance="positive" to="/select-repositories">
              Add repos…
            </LinkButton>
          </div>
        </div>
        <RepositoriesList />
      </div>
    );
  }

  render() {
    return this.renderRepositoriesList();
  }
}

RepositoriesHome.propTypes = {
  auth: PropTypes.object.isRequired,
  isSessionExpired: PropTypes.bool.isRequired,
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
    authError,
    user,
    entities,
    snaps,
    snapBuilds
  } = state;

  return {
    auth,
    isSessionExpired: !!authError.expired,
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
