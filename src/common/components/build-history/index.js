import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import BuildRow from '../build-row';
import { Message } from '../forms';

const BuildHistory = (props) => {
  const { repository, success } = props;

  const builds = props.builds.map((build) => (
    <BuildRow key={build.buildId} {...build} repository={repository} />
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
