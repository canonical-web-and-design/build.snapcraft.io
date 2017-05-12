import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';
import Button from '../../vanilla/button';
import { WarningIcon } from '../icons';

import styles from './dropdowns.css';

const getRemoveWarningMessage = (isBuilt, registeredName) => {
  let warningText;
  if (isBuilt) {
    warningText = (
      'Removing this repo will delete all its builds and build logs.'
    );
  } else {
    warningText = (
      'Are you sure you want to remove this repo from the list?'
    );
  }
  if (registeredName !== null) {
    warningText += ' The name will remain registered.';
  }
  // XXX cjwatson 2017-02-28: Once we can get hold of published states for
  // builds, we should also implement this design requirement:
  //   Separately, if any build has been published, the text should end
  //   with:
  //     Published builds will remain published.

  return warningText;
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
    <span>
      <WarningIcon /> { getRemoveWarningMessage(isBuilt, registeredName) }
    </span>
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
    if (isAuthenticated) {
      if (!isOwnerOfRegisteredName) {
        message = `To remove this repo, contact the person who registered the name ${registeredName}.`;
        actionButton = null;
      }
    } else {
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
            <a onClick={ onCancelClick } className={ styles.cancel }>Cancel</a>
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
