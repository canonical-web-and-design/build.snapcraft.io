import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './selectRepositoryRow.css';

class SelectRepositoryRow extends Component {
  render() {
    const {
      errorMsg,
      repository,
      onChange,
      checked,
      isEnabled
    } = this.props;

    const rowClass = classNames({
      [styles.repositoryRow]: true,
      [styles.error]: errorMsg,
      [styles.repositoryEnabled]: isEnabled
    });

    return (
      <div className={ rowClass }>
        { onChange &&
          <input
            id={ repository.fullName }
            type="checkbox"
            onChange={ this.onChange.bind(this) }
            checked={ checked || isEnabled }
            disabled={ isEnabled }
          />
        }
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

  onChange(event) {
    this.props.onChange(event);
  }
}

SelectRepositoryRow.defaultProps = {
  checked: false,
  isEnabled: false
};

SelectRepositoryRow.propTypes = {
  errorMsg: PropTypes.node,
  repository: PropTypes.shape({
    fullName: PropTypes.string.isRequired
  }).isRequired,
  checked: PropTypes.bool,
  isEnabled: PropTypes.bool,
  onChange: PropTypes.func
};

export default SelectRepositoryRow;
