import expect from 'expect';

import snap from '../../../../../../src/common/reducers/entities/snap.js';

describe('snaps entities', function() {

  let state = {
    store_name: 'test-name'
  };

  it('should update registered name on REGISTER_NAME_SUCCESS', function() {
    expect(snap(state, {
      type: 'REGISTER_NAME_SUCCESS',
      payload: {
        snapName: 'test-name-changed'
      }
    }).store_name).toEqual('test-name-changed');
  });

});
