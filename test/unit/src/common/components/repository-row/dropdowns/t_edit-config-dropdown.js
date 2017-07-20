import { shallow } from 'enzyme';
import expect from 'expect';
import React from 'react';
import url from 'url';

import EditConfigDropdown from '../../../../../../../src/common/components/repository-row/dropdowns/edit-config-dropdown';

describe('<EditConfigDropdown />', () => {
  const props = {
    snap: {
      gitRepoUrl: 'https://github.com/anowner/aname',
      gitBranch: 'dev',
      snapcraftData: { path: 'snap/snapcraft.yaml' }
    }
  };

  it('renders link to edit snapcraft.yaml', function() {
    const view = shallow(<EditConfigDropdown { ...props } />);
    expect(url.parse(view.find('a').prop('href'))).toMatch({
      protocol: 'https:',
      host: 'github.com',
      pathname: '/anowner/aname/edit/dev/snap/snapcraft.yaml'
    });
  });
});
