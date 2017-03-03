import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';
import Button from '../../vanilla/button';
import { WarningIcon } from '../icons';

import styles from './dropdowns.css';

const RemoveRepoDropdown = (props) => {
  const { message, onCancelClick, onRemoveClick } = props;

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <WarningIcon /> { message }
        </Data>
      </Row>
      <Row>
        <div className={ styles.buttonRow }>
          <a
            onClick={ onCancelClick }
            className={ styles.cancel }
          >
            Cancel
          </a>
          <Button
            appearance="negative"
            onClick={ onRemoveClick }
          >
            Remove
          </Button>
        </div>
      </Row>
    </Dropdown>
  );

};

RemoveRepoDropdown.propTypes = {
  message: PropTypes.string.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired
};

export default RemoveRepoDropdown;
