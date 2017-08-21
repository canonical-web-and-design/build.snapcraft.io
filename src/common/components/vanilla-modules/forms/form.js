import React, { PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/forms.css';

export default function Form(props) {
  const { inline=false, stacked=false } = props;
  const className = classNames({
    [styles['p-form--inline']]: inline,
    [styles['p-form--stacked']]: stacked
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
  stacked: PropTypes.bool,
  inline: PropTypes.bool
};
