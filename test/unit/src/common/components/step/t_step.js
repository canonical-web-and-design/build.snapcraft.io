import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';

import Step from '../../../../../../src/common/components/step';

describe('The Step component', () => {
  let component;

  context('when incomplete', () => {
    beforeEach(() => {
      component = shallow(<Step complete={ false } />);
    });

    it('should not show a "complete" icon', () => {
      expect(component.find('img[alt="Complete"]').length).toBe(0);
    });
  });

  context('when complete', () => {
    beforeEach(() => {
      component = shallow(<Step complete={ true } />);
    });

    it('should show a "complete" icon', () => {
      expect(component.find('img[alt="Complete"]').length).toBe(1);
    });
  });
});
