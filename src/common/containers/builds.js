import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildsList from '../components/builds-list';
import Notification from '../components/vanilla-modules/notification';
import { IconSpinner } from '../components/vanilla-modules/icons';
import { HelpBox, HelpCustom, HelpInstallSnap } from '../components/help';
import { HeadingOne, HeadingFive } from '../components/vanilla-modules/heading';
import Badge from '../components/badge';
import Breadcrumbs, { BreadcrumbsLink } from '../components/vanilla-modules/breadcrumbs';
import BetaNotification from '../components/beta-notification';
import Button from '../components/vanilla-modules/button';

import withRepository from './with-repository';
import withSnapBuilds from './with-snap-builds';
import { fetchSnapStableRelease } from '../actions/snaps';
import { requestBuilds } from '../actions/snap-builds';
import { isBuildInProgress } from '../helpers/snap-builds';

import styles from './container.css';

export class Builds extends Component {
  constructor() {
    super();

    this.state = {
      buildTriggered: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    // if builds stopped fetching after they were triggered, reset build button status
    if (this.props.snapBuilds.isFetching && !nextProps.snapBuilds.isFetching) {
      this.setState({ buildTriggered: false });
    }
  }

  componentDidMount() {
    const { url } = this.props.repository;
    const { snap } = this.props;

    if (url && snap && snap.storeName) {
      this.props.fetchSnapStableRelease(url, snap.storeName);
    }
  }

  renderBuilds(repo, builds, heading) {
    return (
      <div>
        <HeadingFive>{heading}</HeadingFive>
        <BuildsList repository={repo} builds={builds} />
      </div>
    );
  }

  renderHelpBoxes() {
    const { snap } = this.props;
    const { builds } = this.props.snapBuilds;
    const isPublished = builds.some(
      (build) => !build.isRequest && build.isPublished
    );

    if (snap && snap.storeName && isPublished) {
      return (
        <div className={`${styles.row} ${styles.strip}`}>
          <div className={styles.rowItem}>
            <HelpBox isFlex>
              <HelpInstallSnap
                headline='To test the latest successful build on your cloud instance or device'
                name={ snap.storeName }
                hasCopyButton
              />
            </HelpBox>
          </div>
          <div className={styles.rowItem}>
            { snap.stableRevision
              ? (
                <HelpBox isFlex>
                  <HelpInstallSnap
                    headline='To install the latest stable version'
                    stable={ true }
                    name={ snap.storeName }
                    hasCopyButton
                  />
                </HelpBox>
              )
              : (
                <HelpBox>
                  <HelpCustom headline='No stable version yet'>
                    <p>Once you’ve promoted a build to stable, you can announce it to your users.</p>
                  </HelpCustom>
                </HelpBox>
              )
            }
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  isRepositoryOwner() {
    const user = this.props.user;
    const owner = this.props.repository.owner;

    // if user is not logged in
    if (!user) {
      return false;
    }

    // if user owns of the repo or one of their orgs owns the repo
    if (user.login === owner || user.orgs.some(o => o.login === owner)) {
      return true;
    }

    return false;
  }

  hasBuildInProgress() {
    return this.props.snapBuilds.builds && this.props.snapBuilds.builds.some(build => isBuildInProgress(build));
  }

  getLatestAndPreviousBuilds() {
    return this.props.snapBuilds.builds.reduce((builds, build) => {
      let { latest, previous } = builds;
      if (build.isRequest && build.statusMessage === 'Building soon') {
        latest.push(build);
      } else if (
        !build.isRequest &&
        latest.filter(
          b => !b.isRequest && b.architecture === build.architecture
        ).length === 0
      ) {
        latest.push(build);
      } else {
        previous.push(build);
      }
      return { latest, previous };
    }, { latest: [], previous: [] });
  }

  onBuildNowClick() {
    this.setState({ buildTriggered: true });
    this.props.requestSnapBuilds(this.props.repository.url);
  }

  render() {
    const { user, repository } = this.props;
    let { isFetching, success, error } = this.props.snapBuilds;

    // only show spinner when data is loading for the first time
    const isLoading = isFetching && !success;
    const isBuilding = this.hasBuildInProgress() || this.state.buildTriggered;

    const { latest, previous } = this.getLatestAndPreviousBuilds();

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repository.fullName} builds`}
        />
        <BetaNotification />
        { user &&
          <Breadcrumbs>
            <BreadcrumbsLink to={`/user/${user.login}`}>My repos</BreadcrumbsLink>
            {' ' /* vanilla assumes space between breadcrumb elements */}
            <BreadcrumbsLink>&nbsp;</BreadcrumbsLink>  {/* hack to show arrow after last breadcrumb item */}
          </Breadcrumbs>
        }
        <div className={styles.repoHeading}>
          <HeadingOne>
            {repository.fullName}
          </HeadingOne>
          <Badge fullName={repository.fullName} buildStatus={latest[0] ? latest[0].statusMessage : null}/>
        </div>
        {/* TODO: show message if there are no builds */}
        { this.renderBuilds(repository, latest, 'Latest builds') }
        { this.isRepositoryOwner() &&
          <div className={styles.buildOnDemand}>
            <Button
              onClick={this.onBuildNowClick.bind(this)}
              disabled={isBuilding}
            >
              Build manually now
            </Button>
          </div>
        }
        { isLoading &&
          <IconSpinner />
        }
        { error &&
          <div className={styles.strip}>
            <Notification status='error' appearance='negative'>{ error.message || error }</Notification>
          </div>
        }
        { this.renderHelpBoxes() }
        { !!previous.length && this.renderBuilds(repository, previous, 'Previous builds') }
      </div>
    );
  }

}

Builds.propTypes = {
  user: PropTypes.shape({
    login: PropTypes.string,
    orgs: PropTypes.array
  }),
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  snap: PropTypes.shape({
    selfLink: PropTypes.string.isRequired,
    storeName: PropTypes.string
  }),
  snapBuilds: PropTypes.shape({
    isFetching: PropTypes.bool,
    builds: PropTypes.arrayOf(
      PropTypes.shape({
        isPublished: PropTypes.bool
      })
    ),
    success: PropTypes.bool,
    error: PropTypes.object
  }),
  fetchSnapStableRelease: PropTypes.func,
  requestSnapBuilds: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    user: state.user
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchSnapStableRelease: (url, name) => dispatch(fetchSnapStableRelease(url, name)),
    requestSnapBuilds: (url) => dispatch(requestBuilds(url))
  };
};

export default withRepository(withSnapBuilds(connect(mapStateToProps, mapDispatchToProps)(Builds)));
