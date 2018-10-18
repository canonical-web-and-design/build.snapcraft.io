import PropTypes from 'prop-types';
import React from 'react';
import styles from './search.css';

export default function SearchInput(props) {
  return (
    <label htmlFor={ props.id }>
      { props.label }
      <input
        id={ props.id }
        className={ styles.searchInput }
        onChange={ props.onChange }
        placeholder={ props.placeholder }
        value={ props.value }
        type='search'
      />
    </label>
  );
}

SearchInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string
};
