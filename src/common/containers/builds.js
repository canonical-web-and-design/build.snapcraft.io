import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildHistory from '../components/build-history';
import { Message } from '../components/forms';
import Spinner from '../components/spinner';

import { fetchBuilds, fetchSnap } from '../actions/snap-builds';

import styles from './container.css';

class Builds extends Component {
  fetchInterval = null

  fetchData({ snapLink, repoFullName }) {
    if (snapLink) {
      this.props.dispatch(fetchBuilds(snapLink));
    } else {
      this.props.dispatch(fetchSnap(repoFullName));
    }
  }

  componentWillMount() {
    this.fetchData(this.props);

    this.fetchInterval = setInterval(() => {
      this.fetchData(this.props);
    }, 15000);
  }

  componentWillUnmount() {
    clearInterval(this.fetchInterval);
  }

  componentWillReceiveProps(nextProps) {
    // if snap link or repo name changed, fetch new data
    if ((this.props.snapLink !== nextProps.snapLink) ||
        (this.props.repoFullName !== nextProps.repoFullName)) {
      this.fetchData(nextProps);
    }
  }

  render() {
    const { account, repo, repoFullName } = this.props;
    // only show spinner when data is loading for the first time
    const isLoading = this.props.isFetching && !this.props.success;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${repoFullName} builds`}
        />
        <h1>{repoFullName} builds</h1>
        <BuildHistory account={account} repo={repo}/>
        { isLoading &&
          <div className={styles.spinner}><Spinner /></div>
        }
        { this.props.error &&
          <Message status='error'>{ this.props.error.message || this.props.error }</Message>
        }
      </div>
    );
  }

}

Builds.propTypes = {
  account: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  repoFullName: PropTypes.string.isRequired,
  isFetching: PropTypes.bool,
  snapLink: PropTypes.string,
  success: PropTypes.bool,
  error: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const repoFullName = `${account}/${repo}`;

  const isFetching = state.snapBuilds.isFetching;
  const snapLink = state.snapBuilds.snapLink;
  const success = state.snapBuilds.success;
  const error = state.snapBuilds.error;

  return {
    isFetching,
    snapLink,
    success,
    error,
    account,
    repo,
    repoFullName
  };
};

export default connect(mapStateToProps)(Builds);
