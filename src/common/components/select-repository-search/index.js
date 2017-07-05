import React, { Component, PropTypes } from 'react';
import styles from './search.css';

export default class SelectRepositorySearch extends Component {

  render() {
    let id = this.props.id || 'search-repositories';
    let label = this.props.label || 'Search';
    let placeholder = this.props.placeholder || 'Filter respositories...';

    return (
      <label htmlFor={ id }>
        { label }
        <input
          id={ id }
          className={ styles.selectRepositorySearch }
          type='search'
          placeholder={ placeholder }
        />
      </label>
    );
  }
}

SelectRepositorySearch.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string
};
