import expect from 'expect';
import { shallow } from 'enzyme';

import { BuildsList } from '../../../../../../src/common/components/builds-list';

describe('<BuildsList />', function() {

  let testProps;

  beforeEach(function() {
    testProps = {
      success: true,
      repository: {
        url: 'http://example.com/foo'
      },
      builds: [{
        buildId: '0'
      }, {
        buildId: '5'
      }, {
        buildId: '17'
      }, {
        buildId: '10'
      }]
    };
  });

  it('should message if has no builds', function() {
    const props = Object.assign({}, testProps, { builds: [] });

    expect(shallow(BuildsList(props)).html())
      .toContain('This snap has not been built yet.');
  });

  it('should message if has falsey builds', function() {
    const props = Object.assign({}, testProps, { builds: false });

    expect(shallow(BuildsList(props)).html())
      .toContain('This snap has not been built yet.');
  });

  it('should sort builds by id', function() {
    const children = shallow(BuildsList(testProps)).find('Body').children();

    const keys = children.map((child) => child.key());

    expect(keys).toEqual(['17', '10', '5', '0']);
  });

});
