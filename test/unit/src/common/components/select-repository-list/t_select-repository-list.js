import expect from 'expect';
import React from 'react';
import { shallow } from 'enzyme';

import {
  SelectRepositoryListComponent
} from '../../../../../../src/common/components/select-repository-list';

describe('<SelectRepositoryListComponent /> instance', function() {

  context('filterEnabledRepos', function() {
    let props;
    let instance;

    beforeEach(function() {

      props = {
        router: {},
        dispatch: () => {},
        user: {
          name: 'Joe Doe',
          login: 'jdoe'
        },
        selectRepositoriesForm: {
          selectedRepos: 'foo'
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
          snaps: [{
            git_repository_url: 'foo/bar'
          }]
        }
      };

      instance = shallow(<SelectRepositoryListComponent { ...props } />).instance();
    });

    it('should flag matching repos as enabled', function() {
      expect(instance.filterEnabledRepos(props.repositories.repos)[0].enabled).toBe(true);
    });
    it('should flag non matching repos as not enabled', function() {
      expect(instance.filterEnabledRepos(props.repositories.repos)[1].enabled).toBe(false);
    });
    it('should reset the enabled flags if we change the snaps list', function() {
      props.snaps.snaps[0].git_repository_url = 'bar/baz';
      expect(instance.filterEnabledRepos(props.repositories.repos)[0].enabled).toBe(false);
    });
  });
});
