import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import HelpInstallSnap from '../../../../../../src/common/components/help/install-snap';

describe('<HelpInstallSnap />', function() {

  const name = 'needleinhaystack';
  const revision = 14159265358979;

  let wrapper;

  beforeEach(function() {
    wrapper = shallow(<HelpInstallSnap name={ name } revision={ revision } />);
  });

  it('should include snap name', function() {
    expect(/needleinhaystack/.test(wrapper.text())).toExist();
  });

  it('should include revision number', function() {
    expect(/14159265358979/.test(wrapper.text())).toExist();
  });
});
