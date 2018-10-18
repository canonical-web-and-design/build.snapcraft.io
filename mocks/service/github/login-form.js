import PropTypes from 'prop-types';
import React from 'react';

export default function LoginForm(props) {
  return (
    <form action={ props.redirectUrl } method="GET">
      <h1>Mock GitHub Login Form</h1>
      <input type='hidden' name='code' value='example_code_REPLACE_ME' />
      <input type='hidden' name='state' value={ props.sharedSecret } />

      <input type='submit' value='Log In' style={ { fontSize: 16 } } />
    </form>
  );
}

LoginForm.propTypes = {
  redirectUrl: PropTypes.string,
  sharedSecret: PropTypes.string
};
