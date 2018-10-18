import PropTypes from 'prop-types';
import React from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';
import Button from '../../vanilla-modules/button';
import { IconWarning } from '../../vanilla-modules/icons';

import styles from './dropdowns.css';

const getRemoveWarningMessage = (isBuilt, registeredName, isOwnerOfRegisteredName) => {
  // XXX cjwatson 2017-02-28: Once we can get hold of published states for
  // builds, we should also implement this design requirement:
  //   Separately, if any build has been published, the text should end
  //   with:
  //     Released builds will remain published.

  return (
    <div className={styles.warningCaption}>
      <p>
        <span className={styles.warningIcon}><IconWarning /></span>
        &nbsp;&nbsp;
        Are you sure you want to remove this repo from the list?
      </p>
      <ul>
        {registeredName !== null && isOwnerOfRegisteredName &&
          <li>The name will remain registered.</li>
        }
        {registeredName !== null && !isOwnerOfRegisteredName &&
          <li>You don’t own the <strong>{registeredName}</strong> name and will not be able to configure this repo again.</li>
        }
        {isBuilt &&
          <li>Removing this repo will delete all its builds and build logs.</li>
        }
      </ul>
    </div>
  );
};

const RemoveRepoDropdown = (props) => {
  const {
    isAuthenticated,
    isOwnerOfRegisteredName,
    isBuilt,
    registeredName,
    onCancelClick,
    onSignInClick,
    onRemoveClick
  } = props;

  let message = (
    getRemoveWarningMessage(isBuilt, registeredName, isOwnerOfRegisteredName)
  );

  let actionButton = (
    <Button
      appearance="negative"
      onClick={ onRemoveClick }
    >
      Remove
    </Button>
  );

  if (registeredName) {
    if (!isOwnerOfRegisteredName) {
      actionButton = (
        <Button
          appearance="negative"
          onClick={ onRemoveClick }
        >
          I understand the consequences, remove this repo
        </Button>
      );
    }

    if (!isAuthenticated) {
      message = `You can remove this repo only if you registered the name ${registeredName}.`;

      actionButton = (
        <Button
          appearance="positive"
          onClick={ onSignInClick }
        >
          Sign in
        </Button>
      );
    }
  }

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          { message }
        </Data>
      </Row>
      { actionButton &&
        <Row>
          <div className={ styles.buttonRow }>
            <Button appearance="base" onClick={ onCancelClick }>Cancel</Button>
            {' '}
            { actionButton }
          </div>
        </Row>
      }
    </Dropdown>
  );

};

RemoveRepoDropdown.propTypes = {
  registeredName: PropTypes.string,
  isBuilt: PropTypes.bool,
  isOwnerOfRegisteredName: PropTypes.bool,
  isAuthenticated: PropTypes.bool,
  onRemoveClick: PropTypes.func.isRequired,
  onSignInClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
};

export default RemoveRepoDropdown;
