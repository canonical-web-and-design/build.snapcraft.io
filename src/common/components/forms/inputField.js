import React, { PropTypes } from 'react';

import styles from './inputField.css';

export default function InputField(props) {
  const { disabled, name, label, type='text', size='full', placeholder } = props;
  const id = `ID_INPUT_FIELD_${name}`;
  const status = props.touched ? (props.valid ? 'success' : 'error') : null;

  return <div className={ `${styles.inputField} ${styles[size]} ${disabled ? styles.disabled : ''}` }>
    <label
      htmlFor={ id }
      className={ `${styles.label} ${styles[status]}` }
    >
      { label }:
    </label>
    <input
      id={ id }
      name={ props.sensitive ? null : name }
      data-name={ name }
      type={ type }
      required={ props.required }
      disabled={ disabled }
      placeholder={ placeholder }
      className={ `${styles.textInput} ${styles[status]}` }
      onChange={ props.onChange }
      onBlur={ props.onBlur }
      value={ props.value || '' }
    />
    <label
      htmlFor={ id }
      className={ `${styles.errorMsg} ${styles[status]}` }
    >
      { props.errorMsg }
    </label>
  </div>;
}

InputField.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  size: PropTypes.oneOf(['full', 'small']),
  sensitive: PropTypes.bool,
  valid: PropTypes.bool,
  touched: PropTypes.bool,
  value: PropTypes.string,
  errorMsg: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
};
