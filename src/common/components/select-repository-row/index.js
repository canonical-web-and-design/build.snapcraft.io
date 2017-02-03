import React, { Component, PropTypes } from 'react';

import styles from './selectRepositoryRow.css';

class SelectRepositoryRow extends Component {
  render() {
    const {
      errorMsg,
      repository,
      onChange,
      checked
    } = this.props;

    return (
      <div className={ `${styles.repositoryRow} ${errorMsg && styles.error}` }>
        { onChange &&
          <input
            type="checkbox"
            onChange={ this.onChange.bind(this) }
            checked={ checked }
          />
        }
        <div>
          {repository.fullName}
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

SelectRepositoryRow.propTypes = {
  errorMsg: PropTypes.node,
  repository: PropTypes.shape({
    fullName: PropTypes.string.isRequired
  }).isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func
};

export default SelectRepositoryRow;
