import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';

// Workaround for Redux-wrapped components
// See: https://github.com/airbnb/enzyme/issues/472
import Component from '../../../../../../src/common/components/repository-input';
const RepositoryInput = Component.WrappedComponent;

let dispatch = expect.createSpy();

const baseProps = {
  auth: {
    authenticated: false
  },
  repositoryInput: {
    success: false,
    inputValue: '',
  },
  webhook: {
    error: false
  },
  dispatch: dispatch
};

const mockStore = configureStore();

describe('The RepositoryInput component', () => {
  let component;

  describe('"Login with GitHub" button', () => {
    context('when not authenticated with GitHub', () => {
      beforeEach(() => {
        const store = mockStore(baseProps);
        component = shallow(<RepositoryInput { ...baseProps } store={ store } />);
      });

      it('should be shown', () => {
        expect(component.find('Anchor').length).toBe(1);
      });

      it('should be shown in incomplete step', () => {
        expect(component.find('Step[number="1"][complete=false]').length).toBe(1);
      });

      it('should open /auth/authenticate when clicked', () => {
        expect(component.find('Anchor[href="/auth/authenticate"]').length).toBe(1);
      });
    });

    context('when authenticated with GitHub', () => {
      beforeEach(() => {
        const props = {
          ...baseProps,
          auth: {
            authenticated: true
          }
        };
        const store = mockStore(props);
        component = shallow(<RepositoryInput { ...props } store={ store } />);
      });

      it('should be shown in complete step', () => {
        expect(component.find('Step[number="1"][complete=true]').length).toBe(1);
      });
    });
  });

  describe('Repository field', () => {
    context('when repository has not been verified', () => {
      beforeEach(() => {
        const store = mockStore(baseProps);
        component = shallow(<RepositoryInput { ...baseProps } store={ store } />);
      });

      it('should be shown', () => {
        expect(component.find('InputField[label="Repository URL"]').length).toBe(1);
      });

      it('should be shown in an incomplete step', () => {
        expect(component.find('Step[number="2"][complete=false]').length).toBe(1);
      });
    });

    context('when repository has been verified', () => {
      beforeEach(() => {
        const props = {
          ...baseProps,
          repositoryInput: {
            inputValue: 'example/example',
            success: true
          }
        };
        const store = mockStore(props);
        component = shallow(<RepositoryInput { ...props } store={ store } />);
      });
      it('should be shown in completed step', () => {
        expect(component.find('Step[number="2"][complete=true]').length).toBe(1);
      });
    });

    context('when value changed', () => {
      const store = mockStore(baseProps);

      beforeEach(() => {
        component = shallow(<RepositoryInput { ...baseProps } store={ store } />);
        component.instance().onChange.call(
          component.instance(),
          { target: { value: 'example/example' } }
        );
      });

      it('should dispatch "setGitHubRepository" with new value', () => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'SET_GITHUB_REPOSITORY',
          payload: 'example/example'
        });
      });
    });

    context('when form is submitted', () => {
      beforeEach(() => {
        const store = mockStore(baseProps);
        component = shallow(<RepositoryInput { ...baseProps } store={ store } />);
        component.instance().onSubmit.call(
          component.instance(),
          { target: { value: 'example/example' }, preventDefault: () => {} }
        );
      });

      it('should dispatch "setGitHubRepository" with new value', () => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'SET_GITHUB_REPOSITORY',
          payload: 'example/example'
        });
      });
    });
  });
});
