import { shallow } from 'enzyme';
import expect from 'expect';
import React from 'react';

import { HelpInstallSnap } from '../../../../../src/common/components/help';
import { Builds } from '../../../../../src/common/containers/builds';

describe('The Builds container', function() {
  const baseProps = {
    repository: {
      owner: 'anowner',
      name: 'aname',
      fullName: 'anowner/aname',
      url: 'https://github.com/anowner/aname'
    },
    snap: {
      selfLink: 'https://api.launchpad.net/devel/~anowner/+snap/aname',
      storeName: 'test-snap'
    },
    snapBuilds: {
      builds: []
    },
    fetchSnapStableRelease: () => {}
  };

  it('omits link to "My repos" if not signed in', function() {
    const element = shallow(<Builds { ...baseProps } />);
    expect(element.find('BreadcrumbsLink').length).toBe(0);
  });

  it('shows link to "My repos" if signed in', function() {
    const props = { ...baseProps, user: { login: 'test-user', orgs: [] } };
    const element = shallow(<Builds { ...props } />);
    expect(element.find('BreadcrumbsLink').length).toBe(2);
    expect(element.find('BreadcrumbsLink').first().prop('to')).toBe('/user/test-user');
  });

  it('omits snap testing instructions if snap has no published ' +
     'builds', function() {
    const props = {
      ...baseProps,
      snapBuilds: {
        ...baseProps.snapBuilds,
        builds: [ { isPublished: false } ]
      }
    };
    const element = shallow(<Builds { ...props } />);
    expect(element.find(HelpInstallSnap).length).toBe(0);
  });

  it('shows snap testing instructions if snap has published ' +
     'builds', function() {
    const props = {
      ...baseProps,
      snapBuilds: {
        ...baseProps.snapBuilds,
        builds: [ { isPublished: false }, { isPublished: true } ]
      }
    };
    const element = shallow(<Builds { ...props } />);
    expect(element.find(HelpInstallSnap).length).toBe(1);
    expect(element.find(HelpInstallSnap).prop('name')).toBe('test-snap');
  });
});
