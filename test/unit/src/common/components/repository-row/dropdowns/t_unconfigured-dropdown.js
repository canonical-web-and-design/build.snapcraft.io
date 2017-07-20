import { shallow } from 'enzyme';
import expect from 'expect';
import React from 'react';
import url from 'url';

import templateYaml from '../../../../../../../src/common/components/repository-row/dropdowns/template-yaml';
import UnconfiguredDropdown from '../../../../../../../src/common/components/repository-row/dropdowns/unconfigured-dropdown';

describe('<UnconfiguredDropdown />', () => {
  const props = {
    snap: {
      gitRepoUrl: 'https://github.com/anowner/aname',
      gitBranch: 'dev'
    }
  };

  it('renders link to create snapcraft.yaml', function() {
    const view = shallow(<UnconfiguredDropdown { ...props } />);
    const createLink = view.findWhere((node) => {
      return (
        node.type() === 'a' &&
        node.text() === 'get started with a template');
    });
    expect(url.parse(createLink.prop('href'), true)).toMatch({
      protocol: 'https:',
      host: 'github.com',
      pathname: '/anowner/aname/new/dev',
      query: { filename: 'snap/snapcraft.yaml', value: templateYaml }
    });
  });
});
