import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import RemoveRepoDropdown from '../../../../../../../src/common/components/repository-row/dropdowns/remove-repo-dropdown';

describe('<RemoveRepoDropdown />', () => {
  const props = {
    isBuild: false,
    registeredName: null,
    isOwnerOfRegisteredName: false,
    isAuthenticated: false,
    onRemoveClick: () => {},
    onSignInClick: () => {},
    onCancelClick: () => {}
  };

  let view;

  beforeEach(function() {
    view = shallow(<RemoveRepoDropdown { ...props }/>);
  });

  context('when name is not registered', function() {
    beforeEach(() => {
      view.setProps({ registeredName: null });
    });

    it('should render proper warning message', () => {
      expect(view.html()).toContain('Are you sure you want to remove this repo from the list?');
    });

    it('should render Remove button', () => {
      expect(view.find('Button').last().prop('children')).toEqual('Remove');
    });

    context('when repo was ever built', () => {
      beforeEach(() => {
        view.setProps({ isBuilt: true });
      });

      it('should render proper warning message', () => {
        expect(view.html()).toContain('Removing this repo will delete all its builds and build logs.');
      });
    });
  });

  context('when name is registered', function() {
    beforeEach(function() {
      view.setProps({ registeredName: 'test-registered-name' });
    });

    context('when user is not signed in', () => {
      beforeEach(function() {
        view.setProps({ isAuthenticated: false });
      });

      it('should render proper warning message', () => {
        expect(view.html()).toContain('You can remove this repo only if you registered the name');
      });

      it('should render Sign in button', () => {
        expect(view.find('Button').last().prop('children')).toEqual('Sign in');
      });
    });

    context('when user is signed in', () => {
      beforeEach(function() {
        view.setProps({ isAuthenticated: true });
      });

      context('when user owns registered name', () => {
        beforeEach(function() {
          view.setProps({ isOwnerOfRegisteredName: true });
        });

        it('should render proper warning message', () => {
          expect(view.html()).toContain('Are you sure you want to remove this repo from the list?');
        });

        it('should render Remove button', () => {
          expect(view.find('Button').last().prop('children')).toEqual('Remove');
        });
      });

      context('when user does not own registered name', () => {
        beforeEach(function() {
          view.setProps({ isOwnerOfRegisteredName: false });
        });

        it('should render proper warning message', () => {
          expect(view.html()).toContain('To remove this repo, contact the person who registered the name');
        });

        it('should render Remove button', () => {
          expect(view.find('Button').length).toEqual(0);
        });
      });
    });
  });
});
