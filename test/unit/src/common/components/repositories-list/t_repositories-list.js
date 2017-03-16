import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import { RepositoriesListView } from '../../../../../../src/common/components/repositories-list';
import { Table, Body } from '../../../../../../src/common/components/vanilla/table-interactive';

// state fixtures
const initialState = {
  hasNoRegisteredNames: true,
  hasNoConfiguredSnaps: true,
  snaps: {
    isFetching: false,
    success: false,
    error: {},
    snaps: [{
      git_repository_url: 'https://github.com/earnubs/bsi-test-v'
    }, {
      git_repository_url: 'https://github.com/earnubs/bsi-test-ii'
    }, {
      git_repository_url: 'https://github.com/earnubs/bsi-test-iii'
    }, {
      git_repository_url: 'https://github.com/earnubs/bsi-test-iv'
    }, {
      git_repository_url: 'https://github.com/earnubs/bsi-test-i'
    }]
  }
};

describe('<RepositoriesList />', function() {

  context('with no snaps in list', function() {
    let wrapper;

    beforeEach(function() {
      initialState.snaps.snaps = null;
      wrapper = shallow(<RepositoriesListView { ...initialState } />);
    });

    xit('should display \'No repos\' message', function() {
      expect(wrapper.find(Table).find(Body).dive().text())
        .toBe('No repos');
    });
  });

  context('with all snaps unnamed in list', function() {
    let wrapper;

    beforeEach(function() {
      wrapper = getWrapper(initialState);
    });

    it('should display snap rows', function() {
      expect(wrapper.children().length).toBe(5);
    });

    xit('should display snap rows in alphabetical order', function() {
      expect(wrapper.childAt(0).props().fullName).toBe('earnubs/bsi-test-i');
    });

    it('should set prop on first row to advise that register name dropdown should be open', function() {
      expect(wrapper.childAt(0).props().registerNameIsOpen).toBe(true);
    });

    it('should set prop on following rows to advise that register name dropdown should be closed', function() {
      expect(wrapper.childAt(1).props().registerNameIsOpen).toBe(false);
    });
  });

  context('with any named, but all unconfigured snaps in list', function() {
    let wrapper;

    beforeEach(function() {
      initialState.hasNoRegisteredNames = false;
      initialState.hasNoConfiguredSnaps = true;
      wrapper = getWrapper(initialState);
    });

    it('should set prop on first row to advise that register name dropdown should be open', function() {
      expect(wrapper.childAt(0).props().configureIsOpen).toBe(true);
      expect(wrapper.childAt(0).props().registerNameIsOpen).toBe(false);
    });

    it('should set prop on following rows to advise that register name dropdown should be closed', function() {
      expect(wrapper.childAt(1).props().configureIsOpen).toBe(false);
      expect(wrapper.childAt(1).props().registerNameIsOpen).toBe(false);
    });
  });

  context('with some named and some unconfigured snaps in list', function() {
    let wrapper;

    beforeEach(function() {
      initialState.hasNoRegisteredNames = false;
      initialState.hasNoConfiguredSnaps = false;
      wrapper = getWrapper(initialState);
    });

    it('should set prop on first row to advise that register name dropdown should be open', function() {
      expect(wrapper.childAt(0).props().configureIsOpen).toBe(false);
      expect(wrapper.childAt(0).props().registerNameIsOpen).toBe(false);
    });

    it('should set prop on following rows to advise that register name dropdown should be closed', function() {
      expect(wrapper.childAt(1).props().configureIsOpen).toBe(false);
      expect(wrapper.childAt(1).props().registerNameIsOpen).toBe(false);
    });
  });
});

function getWrapper(state) {
  return shallow(<RepositoriesListView { ...state } />)
    .find(Table)
    .find(Body);
}
