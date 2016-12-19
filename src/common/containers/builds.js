import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildHistory from '../components/build-history';
import { fetchBuilds } from '../actions/snap-builds';

import styles from './container.css';

class Builds extends Component {

  componentWillMount() {
    this.props.dispatch(fetchBuilds(this.props.fullName));
  }

  render() {
    const { account, repo, fullName } = this.props;

    return (
      <div className={ styles.container }>
        <Helmet
          title={`${fullName} builds`}
        />
        <h1>{fullName} builds</h1>
        <BuildHistory account={account} repo={repo}/>
        { this.props.isFetching &&
          <span>Loading...</span>
        }
      </div>
    );
  }

}

Builds.propTypes = {
  account: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  isFetching: PropTypes.bool,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const fullName = `${account}/${repo}`;

  const isFetching = state.snapBuilds.isFetching;

  return {
    isFetching,
    account,
    repo,
    fullName
  };
};

export default connect(mapStateToProps)(Builds);
