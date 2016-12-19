import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import BuildRow from '../build-row';

const BuildHistory = (props) => {
  const { account, repo } = props;
  const builds = props.builds.map((build) => (
    <BuildRow key={build.buildId} {...build} account={account} repo={repo} />
  ));

  return (
    <div>
      {builds}
    </div>
  );
};

BuildHistory.propTypes = {
  account: PropTypes.string,
  repo: PropTypes.string,
  builds: React.PropTypes.arrayOf(React.PropTypes.object)
};

function mapStateToProps(state) {
  const builds = state.snapBuilds.builds;

  return {
    builds
  };
}

export default connect(mapStateToProps)(BuildHistory);
