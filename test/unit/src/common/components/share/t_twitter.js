import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import { Tweet } from '../../../../../../src/common/components/share';

describe('<Tweet />', function() {
  let wrapper;

  beforeEach(function() {
    wrapper = shallow(<Tweet text={ 'foo' } />);
  });

  it('should be an anchor', function() {
    expect(wrapper.type()).toBe('a');
  });

  it('should have an @href with the correct twitter intent url', function() {
    expect(wrapper.find('[href="https://twitter.com/intent/tweet?text=foo"]')).toExist();
  });

  it('should encode url in @href', function() {
    wrapper.setProps({ text: 'foo&bar' });
    expect(wrapper.find('[href="https://twitter.com/intent/tweet?text=foo%26bar"]')).toExist();
  });
});
