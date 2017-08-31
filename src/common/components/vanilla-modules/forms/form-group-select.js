import React, { PropTypes } from 'react';

import styles from '../../../style/vanilla/css/forms.css';

export default function FormGroupSelect(props) {
  const { disabled, name, label, placeholder } = props;
  const id = `ID_${name}`;
  const status = props.touched ? ( props.valid ? 'is-success' : 'is-error') : null;

  return (
    <div className={ `${styles['p-form__group']} ${styles['p-form-validation']} ${styles[status]}` }>
      <label htmlFor={ id } className={ styles['p-form__label'] }>
        { label }
      </label>
      <div className={ styles['p-form__control'] }>
        <select
          id={ id }
          name={ props.sensitive ? null : name }
          data-name={ name }
          required={ props.required }
          disabled={ disabled }
          onChange={ props.onChange }
        >
          <option value="">{ placeholder }</option>
          { props.children }
        </select>
        { props.errorMsg &&
          <p className={ styles['p-form-validation__message'] } role="alert">
            <strong>Error:</strong> { props.errorMsg }
          </p>
        }
      </div>
    </div>
  );
}

FormGroupSelect.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: React.PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  sensitive: PropTypes.bool,
  valid: PropTypes.bool,
  touched: PropTypes.bool,
  errorMsg: PropTypes.string,
  onChange: PropTypes.func
};
