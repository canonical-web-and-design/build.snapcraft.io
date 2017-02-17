import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildRow from '../components/build-row';
import BuildLog from '../components/build-log';
import { Message } from '../components/forms';
import HelpInstallSnap from '../components/help/install-snap';

import withRepository from './with-repository';
import { fetchBuilds, fetchSnap } from '../actions/snap-builds';
import { snapBuildsInitialStatus } from '../reducers/snap-builds';

import styles from './container.css';

class BuildDetails extends Component {

  fetchData({ snapLink, repository }) {
    if (snapLink) {
      this.props.dispatch(fetchBuilds(repository.url, snapLink));
    } else if (repository) {
      this.props.dispatch(fetchSnap(repository.url));
    }
  }

  componentDidMount() {
    this.fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const currentSnapLink = this.props.snapLink;
    const nextSnapLink = nextProps.snapLink;
    const currentRepository = this.props.repository.fullName;
    const nextRepository = nextProps.repository.fullName;

    if ((currentSnapLink !== nextSnapLink) || (currentRepository !== nextRepository)) {
      // if snap link or repo changed, fetch new data
      this.fetchData(nextProps);
    }
  }

  render() {
    const { repository, buildId, build, error, isFetching } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repository.fullName} builds`}
        />
        <h1>{repository.fullName} build #{buildId}</h1>
        { isFetching &&
          <span>Loading...</span>
        }
        { error &&
          <Message status='error'>{ error.message || error }</Message>
        }
        { build &&
          <div>
            <BuildRow repository={repository} {...build} />
            <h3>Build log:</h3>
            <BuildLog logUrl={build.buildLogUrl} />
          </div>
        }
        <HelpInstallSnap name='foo' revision='1' />
      </div>
    );
  }

}
BuildDetails.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  buildId: PropTypes.string.isRequired,
  build: PropTypes.object,
  isFetching: PropTypes.bool,
  snapLink: PropTypes.string,
  error: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const owner = ownProps.params.owner.toLowerCase();
  const name = ownProps.params.name.toLowerCase();
  const fullName = `${owner}/${name}`;
  const repository = state.repository;

  const buildId = ownProps.params.buildId.toLowerCase();

  // get builds for given repo from the store or set default empty values
  const repoBuilds = state.snapBuilds[fullName] || snapBuildsInitialStatus;

  const build = repoBuilds.builds.filter((build) => build.buildId === buildId)[0];
  const isFetching = repoBuilds.isFetching;
  const error = repoBuilds.error;
  const snapLink = repoBuilds.snapLink;

  return {
    fullName,
    repository,
    buildId,
    build,
    isFetching,
    snapLink,
    error
  };
};

export default connect(mapStateToProps)(withRepository(BuildDetails));
