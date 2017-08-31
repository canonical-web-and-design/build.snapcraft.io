import React, { PropTypes } from 'react';

import styles from '../../../style/vanilla/css/forms.css';

export default function FormGroupCheckboxRadio(props) {
  const { disabled, name, label, type } = props;
  const id = `ID_${name}`;

  return (
    <div className={ `${styles['p-form__group']}` }>
      <label htmlFor={ id } className={ styles['p-form__label'] }>
        <input
          id={ id }
          name={ props.sensitive ? null : name }
          data-name={ name }
          type={ type }
          disabled={ disabled }
          required={ props.required }
          onChange={ props.onChange }
          onBlur={ props.onBlur }
        />{ label }
      </label>
    </div>
  );
}

FormGroupCheckboxRadio.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
  name: PropTypes.string.isRequired,
  sensitive: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func,
  required: PropTypes.bool
};
