import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { createWebhook } from '../actions/webhook';
import { Message } from '../components/forms';
import Spinner from '../components/spinner';

import styles from './container.css';

class RepositorySetup extends Component {
  componentDidMount() {
    const { account, repo, isFetching } = this.props;

    if (!isFetching) {
      this.props.dispatch(createWebhook(account, repo));
    }
  }

  render() {
    const { fullName, isFetching, success, error } = this.props;

    if (success) {
      this.props.router.replace(`/${fullName}/builds`);
    } else {
      return (
        <div className={styles.container}>
          <Helmet
            title={`Setting up ${fullName}`}
          />
          { isFetching &&
            <div className={styles.spinner}><Spinner /></div>
          }
          { error &&
            <Message status='error'>{ this.props.error.message }</Message>
          }
        </div>
      );
    }
  }
}

RepositorySetup.propTypes = {
  account: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  isFetching: PropTypes.bool,
  success: PropTypes.bool,
  error: PropTypes.object,
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const fullName = `${account}/${repo}`;

  const isFetching = state.webhook.isFetching;
  const success = state.webhook.success;
  const error = state.webhook.error;

  return {
    account,
    repo,
    fullName,
    isFetching,
    success,
    error
  };
};

export default connect(mapStateToProps)(withRouter(RepositorySetup));
