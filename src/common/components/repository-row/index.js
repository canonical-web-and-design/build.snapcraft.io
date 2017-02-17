import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import { Row, Data } from '../vanilla/table-interactive';
import BuildStatus from '../build-status';

import { parseGitHubRepoUrl } from '../../helpers/github-url';

const RepositoryRow = (props) => {
  const { snap, latestBuild } = props;
  const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);

  return (
    <Row>
      <Data col="30"><Link to={ `/${fullName}/builds` }>{ fullName }</Link></Data>
      <Data col="20"> </Data>
      <Data col="20"> </Data>
      <Data col="30">
        {/*
          TODO: show 'Loading' when waiting for status?
            and also show 'Never built' when no builds available
        */}
        { latestBuild &&
          <BuildStatus
            link={ `/${fullName}/builds/${latestBuild.buildId}`}
            status={ latestBuild.status }
            statusMessage={ latestBuild.statusMessage }
            dateStarted={ latestBuild.dateStarted }
          />
        }
      </Data>
    </Row>
  );
};

RepositoryRow.propTypes = {
  snap: PropTypes.shape({
    resource_type_link: PropTypes.string,
    git_repository_url: PropTypes.string,
    self_link: PropTypes.string
  }),
  latestBuild: PropTypes.shape({
    buildId: PropTypes.string,
    status: PropTypes.string,
    statusMessage: PropTypes.string
  })
};

export default RepositoryRow;
