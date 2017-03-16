import React, { PropTypes } from 'react';
import url from 'url';

import { parseGitHubRepoUrl } from '../../../helpers/github-url';
import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

const getTemplateUrl = (repositoryUrl, configFilePath) => {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);
  const templateUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: `${fullName}/edit/master/${configFilePath}`
  });

  return templateUrl;
};

const EditConfigDropdown = ({ repositoryUrl, configFilePath }) => {
  const templateUrl = getTemplateUrl(repositoryUrl, configFilePath);

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            This repo has a snapcraft.yaml file.
            <a href={ templateUrl } target="_blank"> You can edit the file on GitHub.</a>
          </p>
        </Data>
      </Row>
    </Dropdown>
  );
};

EditConfigDropdown.propTypes = {
  repositoryUrl: PropTypes.string,
  configFilePath: PropTypes.string
};

export default EditConfigDropdown;
