import expect from 'expect';
import promClient from 'prom-client';

import db from '../../../../../src/server/db';
import {
  BUILD_TRIGGERED_MANUALLY,
  BUILD_TRIGGERED_BY_POLLER
} from '../../../../../src/common/helpers/build_annotation';

describe('The build Annotation metric', () => {
  let updateBuildAnnotationTotal;

  beforeEach(async () => {
    // this needs to be required in test rather then imported
    // to make sure it registers metrics when tests are run and cleared in after hook
    updateBuildAnnotationTotal = require(
      '../../../../../src/server/metrics/build-annotation').default;

    await db.model('BuildAnnotation').query('truncate').fetch();
  });

  afterEach(() => {
    promClient.register.clear();
  });

  it('returns the number of rows in BuildAnnotation', () => {
    return db.transaction(async (trx) => {
      for (let i = 1; i <= 2; i++) {
        const annotation = db.model('BuildAnnotation').forge({
          build_id: i, reason: BUILD_TRIGGERED_BY_POLLER
        });
        await annotation.save({}, { method: 'insert', transacting: trx });
      }
      for (let i = 3; i <= 6; i++) {
        const annotation = db.model('BuildAnnotation').forge({
          build_id: i, reason: BUILD_TRIGGERED_MANUALLY
        });
        await annotation.save({}, { method: 'insert', transacting: trx });
      }

      await updateBuildAnnotationTotal(trx);
      const metricName = 'bsi_build_annotation_total';
      expect(promClient.register.getSingleMetric(metricName).get()).toEqual({
        type: 'gauge',
        name: metricName,
        help: 'Total number of build annotations labelled by reason.',
        values: [{
          labels: { metric_type: 'kpi', reason: BUILD_TRIGGERED_BY_POLLER },
          value: 2
        }, {
          labels: { metric_type: 'kpi', reason: BUILD_TRIGGERED_MANUALLY },
          value: 4
        }]
      });
    });
  });

});
