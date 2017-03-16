import expect from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import {
  SelectRepositoryListComponent
} from '../../../../../../src/common/components/select-repository-list';

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
      selectRepositoriesForm: {
        selectedRepos: []
      },
      repositories: {
        isFetching: false,
        repos: [{
          url: 'foo/bar'
        }, {
          url: 'bar/baz'
        }]
      },
      snaps: {
        success: true,
        snaps: []
      }
    };
  });

  context('when user doesn’t have any repos selected', function() {
    let wrapper;

    beforeEach(function() {
      props.selectRepositoriesForm = {
        selectedRepos: []
      };

      wrapper = shallow(<SelectRepositoryListComponent { ...props } />);
    });

    it('should disable Add button', function() {
      expect(wrapper.find('Button').prop('disabled')).toBe(true);
    });

    it('should show message about 0 selected repos', function() {
      expect(wrapper.html()).toInclude('0 selected');
    });
  });

    xit('should flag matching repos as enabled', function() {
      expect(instance.filterEnabledRepos(props.repositories.repos)[0].enabled).toBe(true);
    });
    xit('should flag non matching repos as not enabled', function() {
      expect(instance.filterEnabledRepos(props.repositories.repos)[1].enabled).toBe(false);
    });
    xit('should reset the enabled flags if we change the snaps list', function() {
      props.snaps.snaps[0].git_repository_url = 'bar/baz';
      expect(instance.filterEnabledRepos(props.repositories.repos)[0].enabled).toBe(false);
    });
  });

});
