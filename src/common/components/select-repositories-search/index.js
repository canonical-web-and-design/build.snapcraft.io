import React, { Component, PropTypes } from 'react';
import styles from './search.css';

export default class SelectRepositoriesSearch extends Component {

  render() {
    let id = this.props.id || 'search-repositories';
    let label = this.props.label || 'Filter respositories';
    let placeholder = this.props.placeholder || 'Filter respositories...';

    return (
      <label htmlFor={ id }>
        { label }
        <input
          id={ id }
          className={ styles.selectRepositoriesSearch }
          type='search'
          placeholder={ placeholder }
        />
      </label>
    );
  }
}

SelectRepositoriesSearch.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string
};
