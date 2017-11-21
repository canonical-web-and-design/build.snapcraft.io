import promClient from 'prom-client';

import db from '../db';

const buildAnnotationTotal = new promClient.Gauge(
  'bsi_build_annotation_total',
  'Total number of build annotations labelled by reason.',
  ['metric_type', 'reason']
);

export default async function updateBuildAnnotationTotal(trx) {
  const counters = await db.model('BuildAnnotation').query( function(q) {
    q.select(db.knex.raw('reason, COUNT(build_id) as total'));
    q.groupBy('reason');
  }).fetchAll({ transacting: trx });

  counters.models.forEach((row) => {
    buildAnnotationTotal.set(
      { metric_type: 'kpi', reason: row.get('reason') }, row.get('total'));
  });
}
