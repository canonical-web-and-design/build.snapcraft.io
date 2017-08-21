import expect from 'expect';
import nock from 'nock';
import sinon from 'sinon';

import { conf } from '../../../../../src/server/helpers/config';
import db from '../../../../../src/server/db';
import {
  buildSnapRepository,
  checkSnapRepository,
  extractPartsToPoll,
  pollRepositories,
  GitSourcePart
} from '../../../../../src/server/scripts/poller';


describe('Poller script helpers', function() {

  afterEach(function() {
    nock.cleanAll();
  });

  describe('pollRepositories', function() {

    beforeEach(async () => {
      await db.model('Repository').query().truncate();
      await db.model('GitHubUser').query().del();
    });

    context('when there are no repositories', function() {
      it('does nothing and returns the iteration lock', async () => {
        let checker = sinon.spy();
        let builder = sinon.spy();
        const lock = await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(0);
        expect(builder.callCount).toBe(0);
        const AsyncLock = require('async-lock');
        expect(lock).toBeA(AsyncLock);
      });
    });

    context('when the repository has no name in snapcraft.yaml', function() {
      it('gets skipped', async () => {
        await db.transaction(async (trx) => {
          const db_user = db.model('GitHubUser').forge({
            github_id: 1234,
            name: null,
            login: 'person',
            last_login_at: new Date()
          });
          await db_user.save({}, { transacting: trx });
          const db_repo = db.model('Repository').forge({
            owner: 'anowner',
            name: 'aname',
            snapcraft_name: null,
            store_name: null,
            registrant_id: db_user.get('id')
          });
          await db_repo.save({}, { transacting: trx });
        });
        let checker = sinon.spy();
        let builder = sinon.spy();
        await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(0);
        expect(builder.callCount).toBe(0);
      });
    });

    context('when the repository has no name registered in the store', function() {
      it('gets skipped', async () => {
        await db.transaction(async (trx) => {
          const db_user = db.model('GitHubUser').forge({
            github_id: 1234,
            name: null,
            login: 'person',
            last_login_at: new Date()
          });
          await db_user.save({}, { transacting: trx });
          const db_repo = db.model('Repository').forge({
            owner: 'anowner',
            name: 'aname',
            snapcraft_name: 'foo',
            store_name: null,
            registrant_id: db_user.get('id')
          });
          await db_repo.save({}, { transacting: trx });
        });
        let checker = sinon.spy();
        let builder = sinon.spy();
        await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(0);
        expect(builder.callCount).toBe(0);
      });
    });

    context('when the repository snapcraft name does not match the one in the store', function() {
      it('gets skipped', async () => {
        await db.transaction(async (trx) => {
          const db_user = db.model('GitHubUser').forge({
            github_id: 1234,
            name: null,
            login: 'person',
            last_login_at: new Date()
          });
          await db_user.save({}, { transacting: trx });
          const db_repo = db.model('Repository').forge({
            owner: 'anowner',
            name: 'aname',
            snapcraft_name: 'foo',
            store_name: 'bar',
            registrant_id: db_user.get('id')
          });
          await db_repo.save({}, { transacting: trx });
        });
        let checker = sinon.spy();
        let builder = sinon.spy();
        await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(0);
        expect(builder.callCount).toBe(0);
      });
    });

    context('when there are repositories with no changes', function() {
      it('gets checked, but not built', async () => {
        await db.transaction(async (trx) => {
          const db_user = db.model('GitHubUser').forge({
            github_id: 1234,
            name: null,
            login: 'person',
            last_login_at: new Date()
          });
          await db_user.save({}, { transacting: trx });
          const db_repo = db.model('Repository').forge({
            owner: 'anowner',
            name: 'aname',
            snapcraft_name: 'foo',
            store_name: 'foo',
            registrant_id: db_user.get('id')
          });
          await db_repo.save({}, { transacting: trx });
        });
        let checker = sinon.stub().returns(false);
        let builder = sinon.spy();
        await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(1);
        expect(checker.calledWithMatch('anowner', 'aname')).toBe(true);
        expect(builder.callCount).toBe(0);
      });
    });

    context('when there are repositories with changes', function() {
      it('gets built', async () => {
        await db.transaction(async (trx) => {
          const db_user = db.model('GitHubUser').forge({
            github_id: 1234,
            name: null,
            login: 'person',
            last_login_at: new Date()
          });
          await db_user.save({}, { transacting: trx });
          const db_repo = db.model('Repository').forge({
            owner: 'anowner',
            name: 'aname',
            snapcraft_name: 'foo',
            store_name: 'foo',
            registrant_id: db_user.get('id')
          });
          await db_repo.save({}, { transacting: trx });
        });
        let checker = sinon.stub().returns(true);
        let builder = sinon.spy();
        await pollRepositories(checker, builder);
        expect(checker.callCount).toBe(1);
        expect(checker.calledWithMatch('anowner', 'aname')).toBe(true);
        expect(builder.callCount).toBe(1);
        expect(builder.calledWith('anowner', 'aname')).toBe(true);
      });
    });

  });

  describe('GitSourcePart helper class construction', function() {

    const repoUrl = 'https://github.com/anowner/aname';

    it('requires a git url', () => {
      expect(() => {new GitSourcePart();}).toThrow(
        'Required parameter: repoUrl');
    });

    it('can be constructed with just a git url', () => {
      var foo = new GitSourcePart(repoUrl);
      expect(foo.repoUrl).toEqual(repoUrl);
      expect(foo.branch).toBe(undefined);
      expect(foo.tag).toBe(undefined);
    });

    it('can be constructed with a git url and branch name', () => {
      var foo = new GitSourcePart(repoUrl, 'mybranch');
      expect(foo.repoUrl).toEqual(repoUrl);
      expect(foo.branch).toEqual('mybranch');
      expect(foo.tag).toBe(undefined);
    });

    it('can be constructed with a git url and tag name', () => {
      var foo = new GitSourcePart(repoUrl, undefined, 'v1.0.0');
      expect(foo.repoUrl).toEqual(repoUrl);
      expect(foo.branch).toBe(undefined);
      expect(foo.tag).toEqual('v1.0.0');
    });

    it('can be constructed with a git url and branch and tag name', () => {
      var foo = new GitSourcePart(repoUrl, 'mybranch', 'v1.0.0');
      expect(foo.repoUrl).toEqual(repoUrl);
      expect(foo.branch).toEqual('mybranch');
      expect(foo.tag).toEqual('v1.0.0');
    });
  });

  describe('GitSourcePart construction from snapcraft source part', () => {
    it('copes with missing parts', () => {
      var part = GitSourcePart.fromSnapcraftPart({});
      expect(part).toBe(undefined);
    });

    it('copes with missing source-type', () => {
      var part = GitSourcePart.fromSnapcraftPart(
        { source: 'https://github.com/foo/bar.git' });
      expect(part.repoUrl).toEqual('https://github.com/foo/bar.git');
      expect(part.branch).toBe(undefined);
      expect(part.tag).toBe(undefined);
    });

    it('skips non-github repositories', () => {
      var part = GitSourcePart.fromSnapcraftPart(
        { source: 'https://git.launchpad.net/foo/bar.git' });
      expect(part).toBe(undefined);
    });

    it('extracts source-branch', () => {
      var part = GitSourcePart.fromSnapcraftPart(
        {
          'source': 'https://github.com/foo/bar.git',
          'source-branch': 'foo',
        });
      expect(part.repoUrl).toEqual('https://github.com/foo/bar.git');
      expect(part.branch).toEqual('foo');
      expect(part.tag).toBe(undefined);
    });

    it('does not support source-tag', () => {
      var part = GitSourcePart.fromSnapcraftPart(
        {
          'source': 'https://github.com/foo/bar.git',
          'source-tag': 'foo',
        });
      expect(part).toBe(undefined);
    });
  });

  describe('checkSnapRepository', function() {
    let ghApi;

    beforeEach(function() {
      ghApi = nock(conf.get('GITHUB_API_ENDPOINT'));
    });

    afterEach(function() {
      ghApi.done();
    });

    context('when there are changes in the snap repository', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(200, { default_branch: 'abranch' });
        ghApi
          .get(/\/repos\/anowner\/aname\/branches\/abranch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762400001 } } } });
      });

      it('returns true', async function() {
        const needs_build = await checkSnapRepository('anowner', 'aname', 1501762400000);
        expect(needs_build).toBe(true);
      });
    });

    context('when there are changes only in a part repository', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(200, { default_branch: 'abranch' });
        ghApi
          .get(/\/repos\/anowner\/aname\/branches\/abranch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762300000 } } } });
        ghApi
          .get(/\/repos\/anowner\/aname\/contents.*/)
          .reply(200, 'parts:\n  foo:\n    source-type: git\n    ' +
                      'source: https://github.com/some/part.git');
        ghApi
          .get(/\/repos\/some\/part.*/)
          .reply(200, { default_branch: 'part_branch' });
        ghApi
          .get(/\/repos\/some\/part\/branches\/part_branch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762400001 } } } });
      });

      it('returns true', async function() {
        const needs_build = await checkSnapRepository('anowner', 'aname', 1501762400000);
        expect(needs_build).toBe(true);
      });
    });

    context('when there are no changes', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(200, { default_branch: 'abranch' });
        ghApi
          .get(/\/repos\/anowner\/aname\/branches\/abranch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762300000 } } } });
        ghApi
          .get(/\/repos\/anowner\/aname\/contents.*/)
          .reply(200, 'parts:\n  foo:\n    source-type: git\n    ' +
                      'source: https://github.com/some/part.git');
        ghApi
          .get(/\/repos\/some\/part.*/)
          .reply(200, { default_branch: 'part_branch' });
        ghApi
          .get(/\/repos\/some\/part\/branches\/part_branch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762300000 } } } });
      });

      it('returns false', async function() {
        const needs_build = await checkSnapRepository('anowner', 'aname', 1501762400000);
        expect(needs_build).toBe(false);
      });
    });

    context('when the snap repository lookup fails', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(404, {});
      });

      it('returns false', async function() {
        const needs_build = await checkSnapRepository('anowner', 'aname', 1501762400000);
        expect(needs_build).toBe(false);
      });
    });

    context('when the snap branch is missing snapcraft.yaml', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(200, { default_branch: 'abranch' });
        ghApi
          .get(/\/repos\/anowner\/aname\/branches\/abranch.*/)
          .reply(200, { commit: { commit: { committer: { date: 1501762300000 } } } });
        ghApi
          .get(/\/repos\/anowner\/aname\/contents.*/)
          .reply(404, {});
      });

      it('returns false', async function() {
        const needs_build = await checkSnapRepository('anowner', 'aname', 1501762400000);
        expect(needs_build).toBe(false);
      });
    });

  });

  describe('buildSnapRepository', function() {
    const LP_API_URL = conf.get('LP_API_URL');
    const LP_API_USERNAME = conf.get('LP_API_USERNAME');
    let lp, db_repo;

    beforeEach(async () => {
      await db.model('Repository').query().truncate();
      await db.model('GitHubUser').query().del();
      await db.transaction(async (trx) => {
        const db_user = db.model('GitHubUser').forge({
          github_id: 1234,
          name: null,
          login: 'person',
          last_login_at: new Date()
        });
        await db_user.save({}, { transacting: trx });
        db_repo = db.model('Repository').forge({
          owner: 'anowner',
          name: 'aname',
          snapcraft_name: 'foo',
          store_name: 'foo',
          registrant_id: db_user.get('id')
        });
        await db_repo.save({}, { transacting: trx });
      });
      lp = nock(LP_API_URL)
        .defaultReplyHeaders({ 'Content-Type': 'application/json' });
    });

    afterEach(function() {
      lp.done();
    });

    context('when LP is properly setup', function() {

      it('the snap is build', async () => {
        lp.get('/devel/+snaps')
          .query({ 'ws.op': 'findByURL', url: 'https://github.com/anowner/aname' })
          .reply(200, [{
            self_link: `${LP_API_URL}/devel/a_snap`,
            owner_link: `/~${LP_API_USERNAME}`,
            auto_build: true
          }]);
        lp.post('/devel/a_snap')
          .reply(200, {});

        expect(db_repo.get('polled_at')).toBe(undefined);
        await buildSnapRepository('anowner', 'aname');
        await db_repo.refresh();
        // TODO: persuade sqlite + knex + bookshelf to deal with datetime
        // column properly, like postgres would do. There we can check it
        // `.toBeA(Date)`. Also don't feel tempted to mock the clock here
        // (sinon.useFakeTimers()) it freezes LP promises and nothing works.
        expect(db_repo.get('polled_at')).toNotBe(undefined);
      });
    });

  });

  context('extractPartsToPoll', () => {

    it('copes with missing parts', () => {
      const snapcraft_yaml = {};
      const parts = extractPartsToPoll(snapcraft_yaml);
      expect(parts).toEqual([]);
    });

    it('copes with missing source-type', () => {
      const snapcraft_yaml = {
        parts: {
          simple: {
            source: 'https://github.com/foo/bar.git'
          }
        }
      };
      const parts = extractPartsToPoll(snapcraft_yaml);
      expect(parts.length).toEqual(1);
      expect(parts[0].repoUrl).toBe('https://github.com/foo/bar.git');
    });

    it('only extracts GH repos', () => {
      const snapcraft_yaml = {
        parts: {
          'gh': {
            'source': 'https://github.com/foo/bar.git'
          },
          'non-gh': {
            'source': 'https://code.launchpad.net/foo/bar.git'
          },
          'non-git': {
            'source': 'https://code.launchpad.net/foo/bar'
          },
          'gh-2': {
            'source': 'https://github.com/foo/zoing.git'
          }
        }
      };
      const parts = extractPartsToPoll(snapcraft_yaml);
      expect(parts.length).toBe(2);
      expect(parts[0].repoUrl).toEqual('https://github.com/foo/bar.git');
      expect(parts[1].repoUrl).toEqual('https://github.com/foo/zoing.git');
    });

  });
});
