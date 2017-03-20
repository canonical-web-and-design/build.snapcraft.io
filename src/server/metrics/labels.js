import { conf } from '../helpers/config';

export default function getDefaultLabels() {
  return { environment: conf.get('ENVIRONMENT'), metric_type: 'kpi' };
}
