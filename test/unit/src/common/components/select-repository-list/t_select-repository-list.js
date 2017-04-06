import expect, { spyOn } from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import {
  SelectRepositoryListComponent
} from '../../../../../../src/common/components/select-repository-list';
import SelectRepositoryRow from '../../../../../../src/common/components/select-repository-row';
import {
  addRepos,
  resetRepository,
  toggleRepositorySelection,
} from '../../../../../../src/common/actions/repository';
import Button, { LinkButton } from '../../../../../../src/common/components/vanilla/button';
import Spinner from '../../../../../../src/common/components/spinner';

describe('<SelectRepositoryListComponent /> instance', function() {
  let props;

  beforeEach(function() {
    props = {
      router: {},
      dispatch: () => {},
      user: {
        name: 'Joe Doe',
        login: 'jdoe'
      },
      entities: {
        snaps: {},
        repos: {
          1001: {
            owner: 1,
            fullName: 'canonical/foo',
            url: 'https://github.com/canonical/foo'
          },
          1002: {
            owner: 1,
            fullName: 'canonical/bar',
            url: 'https://github.com/canonical/bar'
          },
          1003: {
            owner: 1,
            fullName: 'canonical/baz',
            url: 'https://github.com/canonical/baz'
          }
        },
        owners: {
          1: {
            name: 'Canonical Ltd.'
          }
        }
      },
      repositories: {
        isFetching: false,
        ids: [1001,1002,1003]
      },
      snaps: {
        success: true,
        snaps: []
      },
      enabledRepositories: { // stub the selector
        1001: {}
      },
      selectedRepositories: [], // stub the selector
      reposToAdd: [] // stub the selector
    };
  });

  context('initial state, before selecting any repositories', function() {
    let wrapper;
    let spy;

    beforeEach(function() {
      spy = spyOn(props, 'dispatch');
      wrapper = shallow(<SelectRepositoryListComponent { ...props } />);
    });

    afterEach(function() {
      spy.restore();
    });

    it('should show spinner when repositories are being fetched', function() {
      expect(wrapper.find(Spinner).length).toBe(0);
      wrapper.setProps({ repositories: Object.assign({}, props.repositories, { isFetching: true }) });
      expect(wrapper.find(Spinner).length).toBe(1);
    });

    it('should hide LinkButton when has no repositories', function() {
      expect(wrapper.find(LinkButton).length).toBe(1);
      wrapper.setProps({ repositories: Object.assign({}, props.repositories, { ids: [] }) });
      expect(wrapper.find(Spinner).length).toBe(0);
    });

    it('should render disabled Add button', function() {
      expect(wrapper.find('Button').prop('disabled')).toBe(true);
    });

    it('should show message about 0 selected repos', function() {
      expect(wrapper.html()).toInclude('0 selected');
    });

    it('should render same number of rows as repos in state', function() {
      expect(wrapper.find(SelectRepositoryRow).length).toBe(props.repositories.ids.length);
    });

    it('should contain same number of enabled rows as enabledRepositores selector', function() {
      expect(wrapper.find({ isEnabled: true }).length)
        .toBe(Object.keys(props.enabledRepositories).length);
    });

    it('should not try to reset selected state on selected repos on mount', function() {
      wrapper.instance().componentDidMount();
      expect(spy).toNotHaveBeenCalled();
    });

    context('paging repositories list', function() {

      const toBePaged = [...Array(100).keys()];

      // TODO move page length to config, rather than assume it
      it('should slice out first page', function() {
        const page = wrapper.instance().pageSlice(toBePaged, {
          next: 2,
          last: 4
        });
        expect(page.length).toBe(30);
        expect(page[0]).toBe(0);
        expect(page[page.length - 1]).toBe(29);
      });

      it('should slice out second page', function() {
        const page = wrapper.instance().pageSlice(toBePaged, {
          first: 1,
          last: 4,
          next: 3,
          prev: 1
        });
        expect(page.length).toBe(30);
        expect(page[0]).toBe(30);
        expect(page[page.length - 1]).toBe(59);
      });

      it('should slice out last page', function() {
        const page = wrapper.instance().pageSlice(toBePaged, {
          first: 1,
          prev: 3
        });
        expect(page.length).toBe(10);
        expect(page[0]).toBe(90);
        expect(page[page.length - 1]).toBe(99);
      });

      it('should handle list of repos smaller than paging', function() {
        const toBePaged = [...Array(10).keys()];
        const page = wrapper.instance().pageSlice(toBePaged);
        expect(page.length).toBe(10);
        expect(page[0]).toBe(0);
        expect(page[page.length - 1]).toBe(9);
      });
    });
  });

  context('selecting repositories', function() {
    let wrapper;
    let spy;

    beforeEach(function() {
      spy = spyOn(props, 'dispatch');
      wrapper = shallow(<SelectRepositoryListComponent { ...props } />);
    });

    afterEach(function() {
      spy.restore();
    });

    it('should dispatch toggleRepositorySelection from onSelectRepository change event', function() {
      const repoId = 1002;

      wrapper
        .find(SelectRepositoryRow)
        .find({ repository: props.entities.repos[repoId] })
        .simulate('change');

      expect(spy).toHaveBeenCalledWith(toggleRepositorySelection(repoId));
    });
  });

  context('selected repositories', function() {
    let wrapper;
    let spy;
    let repoId = 1002;
    let testProps;

    beforeEach(function() {
      testProps = Object.assign({}, props, { selectedRepositories: [repoId] });

      spy = spyOn(testProps, 'dispatch');
      wrapper = shallow(<SelectRepositoryListComponent { ...testProps } />);
    });

    afterEach(function() {
      spy.restore();
    });

    it('should dispatch reset action on all selected repos on mount', function() {
      wrapper.instance().componentDidMount();
      expect(spy).toHaveBeenCalledWith(resetRepository(repoId));
    });
  });

  context('adding repositories', function() {
    let wrapper;
    let spy;
    let testProps;

    beforeEach(function() {
      testProps = Object.assign({}, props, { reposToAdd: ['foo'] });
      spy = spyOn(testProps, 'dispatch');
      wrapper = shallow(<SelectRepositoryListComponent { ...testProps } />);
    });

    afterEach(function() {
      spy.restore();
    });

    it('should dispatch selected repositories for building on add button click', function() {
      wrapper.find(Button).simulate('click');
      expect(spy).toHaveBeenCalledWith(addRepos(testProps.reposToAdd));
    });
  });
});
