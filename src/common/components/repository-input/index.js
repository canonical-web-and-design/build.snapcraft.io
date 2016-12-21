import 'isomorphic-fetch';

import React, { Component, PropTypes } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import {
  createSnap,
  setGitHubRepository
} from '../../actions/repository-input';

import Button from '../button';
import { Form, InputField, Message } from '../forms';

export class RepositoryInput extends Component {
  constructor(props) {
    super(props);
  }

  getErrorMessage() {
    const input = this.props.repositoryInput;
    let message;

    if (input.inputValue.length > 2 && !input.repository) {
      message = 'Please enter a valid GitHub repository name or URL.';
    } else if (input.error) {
      if (input.repository) {
        message = `Repository ${input.repository} doesn't exist, is not public or doesn't contain snapcraft.yaml file.`;
      } else {
        message = input.error.message;
      }
    }

    return message;
  }

  componentWillReceiveProps(nextProps) {
    const input = nextProps.repositoryInput;

    if (input.success && this.props.repositoryInput.success !== input.success) {
      this.props.router.push(`${input.repository}/builds`);
    }
  }

  render() {
    const input = this.props.repositoryInput;

    const isTouched = input.inputValue.length > 2;
    const isValid = !!input.repository && !input.error;

    return (
      <Form onSubmit={this.onSubmit.bind(this)}>

        <InputField
          label='Repository URL'
          placeholder='username/snap-example'
          value={input.inputValue}
          touched={isTouched}
          valid={isValid}
          onChange={this.onInputChange.bind(this)}
          errorMsg={this.getErrorMessage()}
        />
        { input.success &&
          <Message status='info'>
            Repository <a href={input.repositoryUrl}>{input.repository}</a> contains snapcraft project and can be built.
          </Message>
        }
        <Button type='submit' disabled={!isValid || input.isFetching}>
          { input.isFetching ? 'Creating...' : 'Create' }
        </Button>
      </Form>
    );
  }

  onInputChange(event) {
    this.props.dispatch(setGitHubRepository(event.target.value));
  }

  onSubmit(event) {
    const { repository } = this.props.repositoryInput;

    if (repository) {
      this.props.dispatch(createSnap(repository));
    }
    event.preventDefault();
  }
}

RepositoryInput.propTypes = {
  router: PropTypes.object.isRequired,
  repositoryInput: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const {
    repositoryInput
  } = state;

  return {
    repositoryInput
  };
}

export default connect(mapStateToProps)(withRouter(RepositoryInput));
