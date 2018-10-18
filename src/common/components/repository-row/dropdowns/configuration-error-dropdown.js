import PropTypes from 'prop-types';
import React from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

import getTemplateUrl from './template-url.js';

const ConfigurationErrorDropdown = ({ snap }) => {

  // XXX
  // to access info about yaml parse error (YAMLException, from js-yaml module)
  //
  //  snap.snapcraftData.error = {
  //    name: "YAMLException"
  //
  //    // reason is a short message with reason of the error
  //    reason: "bad indentation of a mapping entry"
  //
  //    // detailed message with position of the error, formatted for command line (assumes fixed width font)
  //    message: "bad indentation of a mapping entry at line 2, column 7:↵      test: indent error↵          ^"
  //
  //    // mark contains detailed info about position of the error
  //    mark: {
  //      buffer: "name: yaml-parse-fail-test↵  test: indent error↵"
  //      column: 6
  //      line: 1
  //      name: null
  //      position: 33
  //    }
  //  }
  let content;

  if (snap.gitBranch && snap.snapcraftData.error) {
    content = (
      <div>
        <p>
          The snapcraft.yaml can’t be used because it isn’t valid.
        </p>
        <p>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={getTemplateUrl(snap)}
          >
            Edit snapcraft.yaml…
          </a>
        </p>
      </div>
    );
  } else {
    content = (
      <p>Check whether the repo has been made private or deleted from GitHub.</p>
    );
  }

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          {content}
        </Data>
      </Row>
    </Dropdown>
  );
};

ConfigurationErrorDropdown.propTypes = {
  snap: PropTypes.shape({
    gitRepoUrl: PropTypes.string,
    gitBranch: PropTypes.string,
    snapcraftData: PropTypes.object
  }),
};

export default ConfigurationErrorDropdown;
