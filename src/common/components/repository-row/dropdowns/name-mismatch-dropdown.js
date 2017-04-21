import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

import getTemplateUrl from './template-url.js';
import {
  // NAME_OWNERSHIP_ALREADY_OWNED, // TODO: #299
  NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER
} from '../../../actions/register-name';

import styles from './dropdowns.css';

const NameMismatchDropdown = (props) => {
  const { snapcraftData, storeName } = props.snap;

  let helpText;

  if (snapcraftData.nameOwnershipStatus === NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER) {
    helpText = getNameRegisteredByOtherUserHelpText(props.snap);
  // TODO cover name registered for another repo #299
  // } else if (snapcraftData.nameOwnershipStatus === NAME_OWNERSHIP_ALREADY_OWNED) {
  //   ...
  // }
  } else if (snapcraftData.nameOwnershipStatus) {
    helpText = getNameMismatchHelpText(props.snap, props.onOpenRegisterNameClick);
  }

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            The snapcraft.yaml uses the snap name “{snapcraftData.name}”,
            but you’ve registered the name “{storeName}”.
          </p>
          { helpText }
        </Data>
      </Row>
    </Dropdown>
  );
};

function getNameRegisteredByOtherUserHelpText(snap) {
  const { snapcraftData, storeName, gitRepoUrl } = snap;

  return (
    <p>
      “{snapcraftData.name}” is registered to someone else. {' '}
      Probably best to {' '}
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={getTemplateUrl(gitRepoUrl, snapcraftData.path)}
      >
        change snapcraft.yaml
      </a> to use “{storeName}” instead.
    </p>
  );
}

function getNameMismatchHelpText(snap, onOpenRegisterNameClick) {
  const { snapcraftData, storeName, gitRepoUrl } = snap;

  return (
    <div className={styles.caption}>
      <p>You can:</p>
      <ul>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={getTemplateUrl(gitRepoUrl, snapcraftData.path)}
          >
            Change snapcraft.yaml
          </a> to use “{storeName}”
        </li>
        <li>
          <a onClick={onOpenRegisterNameClick}>Register the name</a> “{snapcraftData.name}”
        </li>
      </ul>
    </div>
  );
}

NameMismatchDropdown.propTypes = {
  snap: PropTypes.shape({
    storeName: PropTypes.string,
    snapcraftData: PropTypes.shape({
      name: PropTypes.string
    })
  }),
  onOpenRegisterNameClick: PropTypes.func,
};

export default NameMismatchDropdown;
