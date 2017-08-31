import React, { PropTypes } from 'react';

import styles from '../../../style/vanilla/css/forms.css';

export default function FormGroupInput(props) {
  const { disabled, name, label, type, placeholder } = props;
  const id = `ID_${name}`;
  const status = props.touched ? ( props.valid ? 'is-success' : 'is-error') : null;

  return (
    <div className={ `${styles['p-form__group']} ${styles['p-form-validation']} ${styles[status]}` }>
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
        />
        { props.errorMsg &&
          <p className={ styles['p-form-validation__message'] } role="alert">
            <strong>Error:</strong> { props.errorMsg }
          </p>
        }
      </div>
    </div>
  );
}

FormGroupInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  sensitive: PropTypes.bool,
  valid: PropTypes.bool,
  touched: PropTypes.bool,
  errorMsg: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
};
