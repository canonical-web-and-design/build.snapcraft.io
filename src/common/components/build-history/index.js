import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import BuildRow from '../build-row';
import { Message } from '../forms';

export const BuildHistory = (props) => {
  const { repository, success, builds } = props;

  const hasBuilds = (builds && builds.length > 0);

  if (!success) {
    return null;
  }

  if (!hasBuilds) {
    return <Message status='info'>This snap has not been built yet.</Message>;
  }

  const buildRows = builds
    .sort((a,b) => ((+b.buildId) - (+a.buildId)))
    .map((build) => (
      <BuildRow key={build.buildId} {...build} repository={repository} />
    ));

  return <div>{ buildRows }</div>;
};

BuildHistory.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string,
    name: PropTypes.string
  }),
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
