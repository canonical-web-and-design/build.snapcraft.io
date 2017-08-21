import React, { PropTypes } from 'react';

import styles from '../../../style/vanilla/css/forms.css';

export default function FormGroupTextarea(props) {
  const { disabled, name, label, type, placeholder } = props;
  const id = `ID_${name}`;
  const status = props.touched ? ( props.valid ? 'p-form-validation is-success' : 'p-form-validation is-error') : null;

  return (
    <div className={ `${styles['p-form__group']} ${styles[status]}` }>
      <label htmlFor={ id } className={ styles['p-form__label'] }>
        { label }
      </label>
      <div className={ styles['p-form__control'] }>
        <textarea
          id={ id }
          name={ props.sensitive ? null : name }
          data-name={ name }
          required={ props.required }
          style={ props.resize ? null : {resize: 'none'}}
          disabled={ disabled }
          placeholder={ placeholder }
          rows={ props.rows }
          onChange={ props.onChange }
          onBlur={ props.onBlur }
          value={ props.value || '' }
        />
        { props.errorMsg &&
          <p className={ styles['p-form-validation__message'] } role="alert">
            <strong>Error:</strong> { props.errorMsg }
          </p>
        }
      </div>
    </div>
  )
}

FormGroupTextarea.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  sensitive: PropTypes.bool,
  valid: PropTypes.bool,
  rows: PropTypes.number,
  resize: PropTypes.bool,
  touched: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  errorMsg: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
};
