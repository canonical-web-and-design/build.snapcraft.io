import expect from 'expect';
import moment from 'moment';
import nock from 'nock';
import path from 'path';
import sinon from 'sinon';

import { conf } from '../../../../../src/server/helpers/config';
import db from '../../../../../src/server/db';
import {
  checkSnapRepository,
  extractPartsToPoll,
  pollRepositories,
  GitSourcePart
} from '../../../../../src/server/scripts/poller';
import { requireWithMockConfigHelper } from '../../../../helpers';


describe('Poller script helpers', function() {

  afterEach(function() {
    nock.cleanAll();
  });

  describe('pollRepositories', function() {
    let db_repo;

    beforeEach(async () => {
      await db.model('BuildAnnotation').query().truncate();
      await db.model('Repository').query().truncate();
      await db.model('GitHubUser').query().del();
      return db.transaction(async (trx) => {
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
    });

    context('when there are no repositories', function() {
      it('does nothing, returns no results', async () => {
        await db.model('Repository').query().truncate();
        let checker = sinon.spy();
        const results = await pollRepositories(checker);
        expect(checker.callCount).toBe(0);
        expect(results).toBeA('array');
        expect(results.length).toBe(0);
      });
    });

    context('when the repository has no name in snapcraft.yaml', function() {
      it('gets skipped', async () => {
        await db_repo.save({ snapcraft_name: null });
        let checker = sinon.spy();
        await pollRepositories(checker);
        expect(checker.callCount).toBe(0);
      });
    });

    context('when the repository has no name registered in the store', function() {
      it('gets skipped', async () => {
        await db_repo.save({ store_name: null });
        let checker = sinon.spy();
        await pollRepositories(checker);
        expect(checker.callCount).toBe(0);
      });
    });

    context('when the repository snapcraft name does not match the one in the store', function() {
      it('gets skipped', async () => {
        await db_repo.save({ snapcraft_name: 'bar', store_name: 'baz' });
        let checker = sinon.spy();
        await pollRepositories(checker);
        expect(checker.callCount).toBe(0);
      });
    });

    context('when there are repositories', function() {
      const LP_API_URL = conf.get('LP_API_URL');
      const LP_API_USERNAME = conf.get('LP_API_USERNAME');
      let lp;

      beforeEach(() => {
        lp = nock(LP_API_URL)
          .defaultReplyHeaders({ 'Content-Type': 'application/json' });
        lp.get('/devel/+snaps')
          .query({ 'ws.op': 'findByURL', url: 'https://github.com/anowner/aname' })
          .reply(200, [{
            owner_link: `/~${LP_API_USERNAME}`,
            self_link: `/~${LP_API_USERNAME}/+snap/a_snap`,
            builds_collection_link: `${LP_API_URL}/devel/~${LP_API_USERNAME}/+snap/a_snap/builds`,
            pending_builds_collection_link: `${LP_API_URL}/devel/~${LP_API_USERNAME}/+snap/a_snap/pending_builds`,
            completed_builds_collection_link: `${LP_API_URL}/devel/~${LP_API_USERNAME}/+snap/a_snap/completed_builds`,
            auto_build: true
          }]);
      });

      afterEach(() => {
        lp.done();
      });

      it('gets skipped if built within the previous built window', async () => {
        const threshold = conf.get('POLLER_BUILD_THRESHOLD');
        const since = moment().utc().subtract(threshold - 1, 'hours');
        lp.get(`/devel/~${LP_API_USERNAME}/+snap/a_snap/pending_builds`)
          .query({ 'ws.start': '0', 'ws.size': '1' })
          .reply(200, {
            entries: [{
              datebuilt: since.format()
            }]
          });

        let checker = sinon.spy();
        await pollRepositories(checker);
        expect(checker.callCount).toBe(0);
      });

      it('gets checked, but not built if not changed', async () => {
        const threshold = conf.get('POLLER_BUILD_THRESHOLD');
        const since = moment().utc().subtract(threshold + 1, 'hours');
        lp.get(`/devel/~${LP_API_USERNAME}/+snap/a_snap/pending_builds`)
          .query({ 'ws.start': '0', 'ws.size': '1' })
          .reply(200, {
            entries: [{
              datebuilt: since.format()
            }]
          });

        let checker = sinon.stub().returns(false);
        await pollRepositories(checker);
        expect(checker.callCount).toBe(1);
        expect(checker.calledWithMatch('anowner', 'aname')).toBe(true);
        expect(checker.getCall(0).args[2].format()).toBe(since.milliseconds(0).format());
      });

      it('gets checked and built if changed', async () => {
        // TODO: Exotic dance to re-import `pollRepositories` with the
        // `POLLER_REQUEST_BUILDS` configuration option enabled.
        const requireWithMockConfig = requireWithMockConfigHelper.bind(
          null,
          path.resolve(__dirname, '../../../../../src/server/scripts/poller'),
          '../helpers/config'
        );
        const pollRepositoriesMock = requireWithMockConfig({
          POLLER_REQUEST_BUILDS: true
        }).pollRepositories;

        const threshold = conf.get('POLLER_BUILD_THRESHOLD');
        const since = moment().utc().subtract(threshold + 1, 'hours');
        lp.get(`/devel/~${LP_API_USERNAME}/+snap/a_snap/pending_builds`)
          .query({ 'ws.start': '0', 'ws.size': '1' })
          .reply(200, {
            entries: [{
              datebuilt: since.format()
            }]
          });
        lp.post(`/devel/~${LP_API_USERNAME}/+snap/a_snap`)
          .reply(200, [
            { self_link: '+build/100' },
            { self_link: '+build/101' }
          ]);

        let checker = sinon.stub().returns(true);
        await pollRepositoriesMock(checker);
        expect(checker.callCount).toBe(1);
        expect(checker.calledWithMatch('anowner', 'aname')).toBe(true);
        expect(checker.getCall(0).args[2].format()).toBe(since.milliseconds(0).format());

        expect(await db.model('BuildAnnotation').count()).toBe(2);
        const annotations = await db.model('BuildAnnotation').fetchAll();
        expect(annotations.models.map((m) => {
          return { build_id: m.get('build_id'), reason: m.get('reason') };
        }))
          .toContain({ build_id: 100, reason: 'triggered-by-poller' })
          .toContain({ build_id: 101, reason: 'triggered-by-poller' });

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

      it('returns true', async () => {
        const since = moment(1501762400000);
        const needs_build = await checkSnapRepository('anowner', 'aname', since);
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

      it('returns true', async () => {
        const since = moment(1501762400000);
        const needs_build = await checkSnapRepository('anowner', 'aname', since);
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

      it('returns false', async () => {
        const since = moment(1501762400000);
        const needs_build = await checkSnapRepository('anowner', 'aname', since);
        expect(needs_build).toBe(false);
      });
    });

    context('when the snap repository lookup fails', function() {

      beforeEach(function() {
        ghApi
          .get(/\/repos\/anowner\/aname.*/)
          .reply(404, {});
      });

      it('returns false', async () => {
        const since = moment(1501762400000);
        const needs_build = await checkSnapRepository('anowner', 'aname', since);
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

      it('returns false', async () => {
        const since = moment(1501762400000);
        const needs_build = await checkSnapRepository('anowner', 'aname', since);
        expect(needs_build).toBe(false);
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
          'gh-full': {
            'source': 'https://github.com/foo/bar.git'
          },
          'non-gh': {
            'source': 'https://code.launchpad.net/foo/bar.git'
          },
          'non-git': {
            'source': 'https://code.launchpad.net/foo/bar'
          },
          'gh-download': {
            'source': 'https://github.com/foo/bar/releases/download/release-1/a.deb'
          },
          'gh-short': {
            'source': 'https://github.com/foo/zoing'
          }
        }
      };
      const parts = extractPartsToPoll(snapcraft_yaml);
      expect(parts.length).toBe(2);
      expect(parts[0].repoUrl).toEqual('https://github.com/foo/bar.git');
      expect(parts[1].repoUrl).toEqual('https://github.com/foo/zoing');
    });

  });
});
