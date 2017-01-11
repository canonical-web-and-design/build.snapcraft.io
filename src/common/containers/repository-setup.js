import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { createWebhook } from '../actions/webhook';
import { requestBuilds } from '../actions/snap-builds';
import { Message } from '../components/forms';
import Spinner from '../components/spinner';

import styles from './container.css';

class RepositorySetup extends Component {
  componentWillReceiveProps(nextProps) {
    const { fullName, webhook, builds } = nextProps;

    if (webhook.success && builds.success) {
      this.props.router.replace(`/${fullName}/builds`);
    }
  }

  componentDidMount() {
    const { account, repo, fullName, webhook, builds } = this.props;

    if (!webhook.isFetching) {
      this.props.dispatch(createWebhook(account, repo));
    }
    if (!builds.isFetching) {
      this.props.dispatch(requestBuilds(fullName));
    }
  }

  render() {
    const { fullName, webhook, builds } = this.props;
    const isFetching = webhook.isFetching || builds.isFetching;

    return (
      <div className={styles.container}>
        <Helmet
          title={`Setting up ${fullName}`}
        />
        { isFetching &&
          <div className={styles.spinner}><Spinner /></div>
        }
        { webhook.error &&
          <Message status='error'>{ webhook.error.message }</Message>
        }
        { builds.error &&
          <Message status='error'>{ builds.error.message }</Message>
        }
      </div>
    );

  }
}

RepositorySetup.propTypes = {
  account: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  webhook: PropTypes.shape({
    isFetching: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.object
  }),
  builds: PropTypes.shape({
    isFetching: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.object
  }),
  router: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const account = ownProps.params.account.toLowerCase();
  const repo = ownProps.params.repo.toLowerCase();
  const fullName = `${account}/${repo}`;

  return {
    account,
    repo,
    fullName,
    webhook: {
      isFetching: state.webhook.isFetching,
      success: state.webhook.success,
      error: state.webhook.error
    },
    builds: {
      isFetching: state.snapBuilds.isFetching,
      success: state.snapBuilds.success,
      error: state.snapBuilds.error
    }
  };
};

export default connect(mapStateToProps)(withRouter(RepositorySetup));
