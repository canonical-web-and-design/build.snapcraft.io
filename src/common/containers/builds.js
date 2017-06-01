import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import BuildHistory from '../components/build-history';
import { Message } from '../components/forms';
import Spinner from '../components/spinner';
import { HelpBox, HelpCustom, HelpInstallSnap } from '../components/help';
import { HeadingOne } from '../components/vanilla/heading';
import Badge from '../components/badge';
import Breadcrumbs from '../components/vanilla/breadcrumbs';
import BetaNotification from '../components/beta-notification';

import withRepository from './with-repository';
import withSnapBuilds from './with-snap-builds';
import { fetchSnapStableRelease } from '../actions/snaps';

import styles from './container.css';

export class Builds extends Component {
  componentWillMount() {
    const { url } = this.props.repository;
    const { snap } = this.props;

    if (url && snap && snap.storeName) {
      this.props.fetchSnapStableRelease(url, snap.storeName);
    }
  }

  renderHelpBoxes() {
    const { snap } = this.props;
    const { builds } = this.props.snapBuilds;
    const isPublished = builds.some((build) => build.isPublished);

    if (snap && snap.storeName && isPublished) {
      return (
        <div className={styles.row}>
          <div className={styles.rowItem}>
            <HelpBox isFlex>
              <HelpInstallSnap
                headline='To test the latest successful build on your cloud instance or device'
                name={ snap.storeName }
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

  render() {
    const { user, repository } = this.props;
    const { isFetching, success, error } = this.props.snapBuilds;

    // only show spinner when data is loading for the first time
    const isLoading = isFetching && !success;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repository.fullName} builds`}
        />
        <BetaNotification />
        { user &&
          <Breadcrumbs>
            <Link to={`/user/${user.login}`}>My repos</Link>
          </Breadcrumbs>
        }
        <div className={styles.repoHeading}>
          <HeadingOne>
            {repository.fullName}
          </HeadingOne>
          <Badge fullName={repository.fullName} />
        </div>
        <BuildHistory repository={repository} />
        { isLoading &&
          <div className={styles.spinner}><Spinner /></div>
        }
        { error &&
          <Message status='error'>{ error.message || error }</Message>
        }
        { this.renderHelpBoxes() }
      </div>
    );
  }

}

Builds.propTypes = {
  user: PropTypes.shape({
    login: PropTypes.string
  }),
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  snap: PropTypes.shape({
    selfLink: PropTypes.string.isRequired,
    storeName: PropTypes.string.isRequired
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
  fetchSnapStableRelease: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    user: state.user
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchSnapStableRelease: (url, name) => dispatch(fetchSnapStableRelease(url, name))
  };
};

export default withRepository(withSnapBuilds(connect(mapStateToProps, mapDispatchToProps)(Builds)));
