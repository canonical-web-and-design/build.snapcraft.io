import React, { PropTypes } from 'react';

import Button from '../button';

import styles from './repositoryRow.css';

const RepositoryRow = (props) => {

  const {
    errorMsg,
    repository,
    buttonLabel,
    buttonDisabled,
    onButtonClick
  } = props;

  return (
    <div className={ `${styles.repositoryRow} ${errorMsg && styles.error}` }>
      <div>
        {repository.fullName}
      </div>
      { errorMsg &&
        <div className={ styles.errorMessage }>
          { errorMsg }
        </div>
      }
      { onButtonClick &&
        <Button disabled={buttonDisabled} onClick={onButtonClick}>
          { buttonLabel }
        </Button>
      }
    </div>
  );
};

RepositoryRow.propTypes = {
  errorMsg: PropTypes.string,
  repository: PropTypes.shape({
    fullName: PropTypes.string
  }),
  buttonLabel: PropTypes.string.isRequired,
  buttonDisabled: PropTypes.bool,
  onButtonClick: PropTypes.func
};

export default RepositoryRow;
