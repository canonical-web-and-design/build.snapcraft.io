import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './selectRepositoryRow.css';

class SelectRepositoryRow extends Component {

  render() {
    const {
      errorMsg,
      repository,
      onChange,
      isEnabled // is repository already enabled as a snap build
    } = this.props;

    // TODO tidy up when we get rid of prefixes
    const isChecked = repository.__isSelected || isEnabled;
    const isFetching = repository.__isFetching;
    const isDisabled = isEnabled || isFetching;

    const rowClass = classNames({
      [styles.repositoryRow]: true,
      [styles.error]: errorMsg,
      [styles.disabled]: isEnabled
    });

    return (
      <div className={ rowClass }>
        <input
          id={ repository.fullName }
          type="checkbox"
          onChange={ onChange }
          checked={ isChecked }
          disabled={ isDisabled }
        />
        <div>
          <label htmlFor={ repository.fullName }>{repository.fullName}</label>
        </div>
        { errorMsg &&
          <div className={ styles.errorMessage }>
            { errorMsg }
          </div>
        }
      </div>
    );
  }
}

SelectRepositoryRow.defaultProps = {
  __isSelected: false,
  isEnabled: false
};

SelectRepositoryRow.propTypes = {
  errorMsg: PropTypes.node,
  repository: PropTypes.shape({
    fullName: PropTypes.string.isRequired
  }).isRequired,
  isEnabled: PropTypes.bool,
  onChange: PropTypes.func,
  __isSelected: PropTypes.bool
};

export default SelectRepositoryRow;
