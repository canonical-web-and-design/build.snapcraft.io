import React, { PropTypes } from 'react';

export default function Form(props) {
  return <form onSubmit={ props.onSubmit } noValidate={true}>
    { props.children }
  </form>;
}

Form.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func
};
