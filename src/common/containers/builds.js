import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import BuildHistory from '../components/build-history';
import { Message } from '../components/forms';
import Spinner from '../components/spinner';
import { HelpBox, HelpInstallSnap } from '../components/help';
import { HeadingOne } from '../components/vanilla/heading';
import Breadcrumbs from '../components/vanilla/breadcrumbs';
import BetaNotification from '../components/beta-notification';

import withRepository from './with-repository';
import withSnapBuilds from './with-snap-builds';

import styles from './container.css';

export class Builds extends Component {
  render() {
    const { user, repository } = this.props;
    const { isFetching, success, error, snap, builds } = this.props.snapBuilds;

    // only show spinner when data is loading for the first time
    const isLoading = isFetching && !success;

    const isPublished = builds.some((build) => build.isPublished);

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
        <HeadingOne>
          {repository.fullName}
        </HeadingOne>
        <BuildHistory repository={repository} />
        { isLoading &&
          <div className={styles.spinner}><Spinner /></div>
        }
        { error &&
          <Message status='error'>{ error.message || error }</Message>
        }
        { snap && snap.storeName && isPublished &&
          <HelpBox>
            <HelpInstallSnap
              headline='To test this snap on your PC or cloud instance:'
              name={ snap.storeName }
            />
          </HelpBox>
        }
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
  snapBuilds: PropTypes.shape({
    isFetching: PropTypes.bool,
    snap: PropTypes.shape({
      selfLink: PropTypes.string.isRequired,
      storeName: PropTypes.string.isRequired
    }),
    builds: PropTypes.arrayOf(
      PropTypes.shape({
        isPublished: PropTypes.bool
      })
    ),
    success: PropTypes.bool,
    error: PropTypes.object
  })
};

const mapStateToProps = (state) => {
  return {
    user: state.user
  };
};

export default withRepository(withSnapBuilds(connect(mapStateToProps)(Builds)));
