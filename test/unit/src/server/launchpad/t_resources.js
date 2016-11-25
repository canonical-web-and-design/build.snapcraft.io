/* Copyright 2011-2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 */

import expect from 'expect';
import nock from 'nock';

import { conf } from '../../../../../src/server/helpers/config';
import {
  Collection,
  Entry
} from '../../../../../src/server/launchpad/resources';
import getLaunchpad from '../../../../../src/server/launchpad';

const LP_API_URL = conf.get('LP_API_URL');

describe('Resources', () => {
  describe('Collection', () => {
    let lp;

    beforeEach(() => {
      lp = nock(LP_API_URL)
        .defaultReplyHeaders({ 'Content-Type': 'application/json' });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('defines entries based on the given representation', () => {
      const representation = {
        total_size: 2,
        start: 0,
        entries: [{ name: 'one' }, { name: 'two' }]
      };
      const collection = new Collection(
        getLaunchpad(), representation, `${LP_API_URL}/api/devel/~foo/ppas`);
      expect(collection.total_size).toEqual(2);
      expect(collection.entries.length).toEqual(2);
      expect(collection.entries[0].name).toEqual('one');
      expect(collection.entries[1].name).toEqual('two');
    });

    it('retrieves a subset of the collection', () => {
      let entries = [];
      for (let i = 0; i < 100; i++) {
        entries.push({ name: `person${i}` });
      }

      lp.get('/api/devel/~foo/ppas')
        .query({ 'ws.start': 75, 'ws.size': 25 })
        .reply(200, {
          total_size: entries.length,
          start: 75,
          prev_collection_link: `${LP_API_URL}/api/devel/~foo/ppas?ws.size=75`,
          entries: entries.slice(75, 100)
        });

      const representation = {
        total_size: entries.length,
        start: 0,
        next_collection_link:
          `${LP_API_URL}/api/devel/~foo/ppas?ws.start=75&ws.size=75`,
        entries: entries.slice(0, 75)
      };
      const collection = new Collection(
        getLaunchpad(), representation, `${LP_API_URL}/api/devel/~foo/ppas`);
      expect(collection.total_size).toEqual(100);
      expect(collection.entries.length).toEqual(75);
      return collection.lp_slice(75, 25).then(slice => {
        expect(slice.entries.length).toEqual(25);
        expect(slice.entries[0].name).toEqual('person75');
        expect(slice.entries[24].name).toEqual('person99');
      });
    });
  });

  describe('Entry', () => {
    let lp;

    beforeEach(() => {
      lp = nock(LP_API_URL)
        .defaultReplyHeaders({ 'Content-Type': 'application/json' });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('defines properties based on the given representation', () => {
      const representation = {
        resource_type_link: `${LP_API_URL}/api/devel/#person`,
        name: 'foo'
      };
      const entry = new Entry(
        getLaunchpad(), representation, `${LP_API_URL}/api/devel/~foo`);
      expect(entry.resource_type_link)
        .toEqual(`${LP_API_URL}/api/devel/#person`);
      expect(entry.name).toEqual('foo');
    });

    it('saves modified attributes', () => {
      lp.post('/api/devel/~foo', { 'display_name': 'Bar' })
        .matchHeader('X-HTTP-Method-Override', /^PATCH$/)
        .reply(200, {
          resource_type_link: `${LP_API_URL}/api/devel/#person`,
          self_link: `${LP_API_URL}/api/devel/~foo`,
          name: 'foo',
          display_name: 'Bar'
        });

      const representation = {
        http_etag: 'test-etag',
        resource_type_link: `${LP_API_URL}/api/devel/#person`,
        self_link: `${LP_API_URL}/api/devel/~foo`,
        name: 'foo',
        display_name: 'Foo'
      };
      let entry = new Entry(
        getLaunchpad(), representation, `${LP_API_URL}/api/devel/~foo`);
      entry.display_name = 'Bar';
      expect(entry.dirty_attributes).toEqual(['display_name']);
      return entry.lp_save()
        .then(() => { expect(entry.dirty_attributes).toEqual([]); });
    });
  });
});
