import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/forms.css';

export default function FormGroupInput(props) {
  const { disabled, name, label, type, placeholder } = props;
  const id = `ID_${name}`;
  const status = props.touched ? ( props.valid ? 'success' : 'error' ) : null;
  const statusStyle = `is-${status}`;

  return (
    <div className={ styles['p-form__group'] }>
      <label htmlFor={ id } className={ styles['p-form__label'] }>
        { label }
      </label>
      <div className={ styles['p-form__control'] }>
        <input
          id={ id }
          name={ props.sensitive ? null : name }
          data-name={ name }
          type={ type }
          required={ props.required }
          disabled={ disabled }
          placeholder={ placeholder }
          onChange={ props.onChange }
          onBlur={ props.onBlur }
          value={ props.value || '' }
        />
        { props.errorMsg }
      </div>
    </div>
  )
}

FormGroupInput.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  sensitive: PropTypes.bool,
  valid: PropTypes.bool,
  touched: PropTypes.bool,
  value: PropTypes.string,
  errorMsg: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
};
