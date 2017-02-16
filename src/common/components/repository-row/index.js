import React, { PropTypes } from 'react';

import { Row, Data } from '../vanilla/table-interactive';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

const RepositoryRow = (props) => {
  const { snap } = props;
  const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);

  return (
    <Row>
      <Data col="30"><a href={ `/${fullName}/builds` }>{ fullName }</a></Data>
      <Data col="20"> </Data>
      <Data col="20"> </Data>
      <Data col="30"> </Data>
    </Row>
  );
};

RepositoryRow.propTypes = {
  snap: PropTypes.shape({
    resource_type_link: PropTypes.string,
    git_repository_url: PropTypes.string,
    self_link: PropTypes.string
  })
};

export default RepositoryRow;
