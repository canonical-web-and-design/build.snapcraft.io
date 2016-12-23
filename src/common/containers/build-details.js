import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildRow from '../components/build-row';
import BuildLog from '../components/build-log';
import { Message } from '../components/forms';
import { fetchSnap } from '../actions/snap-builds';

import styles from './container.css';

class BuildDetails extends Component {

  componentWillMount() {
    this.props.dispatch(fetchSnap(this.props.fullName));
  }

  render() {
    const { account, repo, fullName, buildId, build } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${fullName} builds`}
        />
        <h1>{fullName} build #{buildId}</h1>
        { this.props.isFetching &&
          <span>Loading...</span>
        }
        { this.props.error &&
          <Message status='error'>{ this.props.error.message || this.props.error }</Message>
        }
        { build &&
          <div>
            <BuildRow account={account} repo={repo} {...build} />
            <h3>Build log:</h3>
            <BuildLog logUrl={build.buildLogUrl} />
          </div>
        }
      </div>
    );
  }

}
BuildDetails.propTypes = {
  account: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  buildId: PropTypes.string.isRequired,
  build: PropTypes.object,
  isFetching: PropTypes.bool,
  error: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const buildId = ownProps.params.buildId.toLowerCase();

  const fullName = `${account}/${repo}`;
  const build = state.snapBuilds.builds.filter((build) => build.buildId === buildId)[0];
  const isFetching = state.snapBuilds.isFetching;
  const error = state.snapBuilds.error;

  return {
    account,
    repo,
    fullName,
    buildId,
    build,
    isFetching,
    error
  };
};

export default connect(mapStateToProps)(BuildDetails);
