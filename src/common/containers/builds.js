import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import BuildHistory from '../components/build-history';
import { Message } from '../components/forms';
import { fetchSnap } from '../actions/snap-builds';

import styles from './container.css';

class Builds extends Component {

  componentWillMount() {
    this.props.dispatch(fetchSnap(this.props.fullName));
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
  fullName: PropTypes.string.isRequired,
  isFetching: PropTypes.bool,
  error: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const fullName = `${account}/${repo}`;

  const isFetching = state.snapBuilds.isFetching;
  const error = state.snapBuilds.error;

  return {
    isFetching,
    error,
    account,
    repo,
    fullName
  };
};

export default connect(mapStateToProps)(Builds);
