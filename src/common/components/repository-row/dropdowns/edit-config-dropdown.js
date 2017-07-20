import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';
import getTemplateUrl from './template-url.js';

const EditConfigDropdown = ({ snap }) => {
  const templateUrl = getTemplateUrl(snap);

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            This repo has a snapcraft.yaml file.{' '}
            <a href={ templateUrl } target="_blank" rel="noreferrer noopener">
              You can edit the file on GitHub.
            </a>
          </p>
        </Data>
      </Row>
    </Dropdown>
  );
};

EditConfigDropdown.propTypes = {
  snap: PropTypes.shape({
    gitRepoUrl: PropTypes.string,
    gitBranch: PropTypes.string,
    snapcraftData: PropTypes.shape({
      path: PropTypes.string
    })
  })
};

export default EditConfigDropdown;
