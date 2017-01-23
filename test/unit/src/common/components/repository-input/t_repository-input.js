import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
// Workaround for Redux-wrapped components
// See: https://github.com/airbnb/enzyme/issues/472
import Component from '../../../../../../src/common/components/repository-input';
const RepositoryInput = Component.WrappedComponent;

import * as ActionTypes from '../../../../../../src/common/actions/repository-input';

const baseProps = {
  auth: {
    authenticated: false
  },
  repositoryInput: {
    success: false,
    inputValue: '',
  },
  repository: null,
  webhook: {
    error: false
  },
};

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

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
            ...baseProps.repositoryInput,
            inputValue: 'example/example',
            success: true
          },
          repository: {
            fullName: 'example/example',
            url: 'https://github.com/example/example'
          },
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
        component = shallow(<RepositoryInput { ...baseProps } dispatch={ store.dispatch } store={ store } />);
        component.instance().onChange.call(
          component.instance(),
          { target: { value: 'example/example' } }
        );
      });

      it('should dispatch "setGitHubRepository" for repository', () => {
        expect(store.getActions()).toHaveActionOfType(
          ActionTypes.SET_GITHUB_REPOSITORY
        );
      });
    });

    context('when form is submitted', () => {
      let store;

      beforeEach(() => {
        const props = {
          ...baseProps,
          repositoryInput: {
            ...baseProps.repositoryInput,
            success: true,
            inputValue: 'test-owner/test-name',
          },
          repository: {
            fullName: 'test-owner/test-name',
            url: 'https://github.com/test-owner/test-name'
          }
        };
        store = mockStore(props);

        component = shallow(<RepositoryInput { ...props } dispatch={ store.dispatch } store={ store } />);
        component.instance().onSubmit.call(
          component.instance(),
          { preventDefault: () => {} } // mocked event object
        );
      });

      it('should dispatch "createSnap" for repository', () => {
        expect(store.getActions()).toHaveActionOfType(
          ActionTypes.CREATE_SNAP
        );
      });
    });
  });
});
