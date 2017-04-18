import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

import getTemplateUrl from './template-url.js';
import {
  // NAME_OWNERSHIP_ALREADY_OWNED, // TODO: #299
  NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER
} from '../../../actions/register-name';

import styles from './dropdowns.css';

const NameMismatchDropdown = (props) => {
  const { snapcraft_data, store_name } = props.snap;

  let helpText;

  if (snapcraft_data.nameOwnershipStatus === NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER) {
    helpText = getNameRegisteredByOtherUserHelpText(props.snap);
  // TODO cover name registered for another repo #299
  // } else if (snapcraft_data.nameOwnershipStatus === NAME_OWNERSHIP_ALREADY_OWNED) {
  //   ...
  // }
  } else if (snapcraft_data.nameOwnershipStatus) {
    helpText = getNameMismatchHelpText(props.snap, props.onOpenRegisterNameClick);
  }

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            The snapcraft.yaml uses the snap name “{snapcraft_data.name}”,
            but you’ve registered the name “{store_name}”.
          </p>
          { helpText }
        </Data>
      </Row>
    </Dropdown>
  );
};

function getNameRegisteredByOtherUserHelpText(snap) {
  const { snapcraft_data, store_name, git_repository_url } = snap;

  return (
    <p>
      “{snapcraft_data.name}” is registered to someone else. {' '}
      Probably best to {' '}
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={getTemplateUrl(git_repository_url, snapcraft_data.path)}
      >
        change snapcraft.yaml
      </a> to use “{store_name}” instead.
    </p>
  );
}

function getNameMismatchHelpText(snap, onOpenRegisterNameClick) {
  const { snapcraft_data, store_name, git_repository_url } = snap;

  return (
    <div className={styles.caption}>
      <p>You can:</p>
      <ul>
        <li>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={getTemplateUrl(git_repository_url, snapcraft_data.path)}
          >
            Change snapcraft.yaml
          </a> to use “{store_name}”
        </li>
        <li>
          <a onClick={onOpenRegisterNameClick}>Register the name</a> “{snapcraft_data.name}”
        </li>
      </ul>
    </div>
  );
}

NameMismatchDropdown.propTypes = {
  snap: PropTypes.shape({
    store_name: PropTypes.string,
    snapcraft_data: PropTypes.shape({
      name: PropTypes.string
    })
  }),
  onOpenRegisterNameClick: PropTypes.func,
};

export default NameMismatchDropdown;
