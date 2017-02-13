import React, { PropTypes } from 'react';

import { TR, TD } from '../vanilla/table';
import { parseGitHubRepoUrl } from '../../helpers/github-url';

const RepositoryRow = (props) => {

  const {
    snap
  } = props;

  const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);

  return (
    <TR>
      <TD><a href={ `/${fullName}/builds` }>{ fullName }</a></TD>
      <TD></TD>
      <TD>{ renderSnapNameLabel(snap) }</TD>
      <TD></TD>
    </TR>
  );
};

const renderSnapNameLabel = (snap) => {
  if (snap.self_link && snap.name) {
    return (
      <a href={ snap.self_link }>
        { snap.name }
      </a>
    );
  }

  return (
    <a>Not registered</a>
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
