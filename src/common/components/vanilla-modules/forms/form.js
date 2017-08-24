import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/forms.css';

export default function Form(props) {
  const { appearance } = props;
  const formStyle = `p-form--${appearance}`;
  const className = classNames({
    [styles[formStyle]]: true
  });

  return (
    <form
      onSubmit={ props.onSubmit }
      noValidate={ true }
      className={ className }
    >
      { props.children }
    </form>
  );
}

Form.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  appearance: PropTypes.oneOf(['inline', 'stacked'])
};
