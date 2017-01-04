import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import BuildRow from '../build-row';
import { Message } from '../forms';

const BuildHistory = (props) => {
  const { account, repo, success } = props;

  const builds = props.builds.map((build) => (
    <BuildRow key={build.buildId} {...build} account={account} repo={repo} />
  ));

  return success ? (
    <div>
      {builds.length > 0
        ? builds
        : <Message status='info'>This snap has not been built yet.</Message>
      }
    </div>
  ) : null;
};

BuildHistory.propTypes = {
  account: PropTypes.string,
  repo: PropTypes.string,
  success: PropTypes.bool,
  builds: React.PropTypes.arrayOf(React.PropTypes.object)
};

function mapStateToProps(state) {
  const builds = state.snapBuilds.builds;
  const success = state.snapBuilds.success;

  return {
    builds,
    success
  };
}

export default connect(mapStateToProps)(BuildHistory);
