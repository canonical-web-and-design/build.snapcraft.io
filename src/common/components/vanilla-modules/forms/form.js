import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from '../../../style/vanilla/css/forms.css';

export default function Form(props) {
  return (
    <form onSubmit={ props.onSubmit } noValidate={true}>
      { props.children }
    </form>;
  );
}

Form.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func
};
