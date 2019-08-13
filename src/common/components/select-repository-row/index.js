import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import styles from './selectRepositoryRow.css';

class SelectRepositoryRow extends Component {

  render() {
    const {
      errorMsg,
      repository,
      onChange,
      isRepoEnabled // is repository already enabled as a snap build
    } = this.props;

    // TODO tidy up when we get rid of prefixes
    const isChecked = repository.isSelected || isRepoEnabled;
    const isFetching = repository.isFetching;
    const isInputDisabled = isRepoEnabled || isFetching || !repository.isAdmin;

    const rowClass = classNames({
      [styles.repositoryRow]: true,
      [styles.error]: errorMsg,
      [styles.disabled]: isRepoEnabled || !repository.isAdmin
    });

    const tooltip = !repository.isAdmin ? 'You don’t have admin permission for this repo' : '';

    return (
      <label htmlFor={ repository.fullName } className={ rowClass } title={tooltip}>
        <input
          id={ repository.fullName }
          type="checkbox"
          onChange={ onChange }
          checked={ isChecked }
          disabled={ isInputDisabled }
        />
        { repository.fullName }
        { errorMsg &&
          <div className={ styles.errorMessage }>
            { errorMsg }
          </div>
        }
      </label>
    );
  }
}

SelectRepositoryRow.defaultProps = {
  isSelected: false,
  isRepoEnabled: false
};

SelectRepositoryRow.propTypes = {
  errorMsg: PropTypes.node,
  repository: PropTypes.shape({
    fullName: PropTypes.string.isRequired,
    isFetching: PropTypes.bool,
    isAdmin: PropTypes.bool,
    isSelected: PropTypes.bool
  }).isRequired,
  isRepoEnabled: PropTypes.bool,
  onChange: PropTypes.func,
  isSelected: PropTypes.bool
};

export default SelectRepositoryRow;
