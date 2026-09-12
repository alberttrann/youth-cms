/**
 * Member lifecycle hooks.
 *
 * - `focusSdgs` validation is shared with Project — see src/utils/focus-sdgs.ts.
 * - Auto-sync legacy `leader` string from `representative` component for backwards compatibility.
 */

import { focusSdgsLifecycles } from '../../../../utils/focus-sdgs';

function syncLeaderFromRepresentative(event: any) {
  const data = event.params?.data;
  if (!data) return;

  if (data.representative) {
    const { prefix, fullName } = data.representative;
    const name = [prefix, fullName].filter(Boolean).join(' ').trim();
    if (name) {
      data.leader = name;
    }
  }
}

export default {
  beforeCreate(event: any) {
    focusSdgsLifecycles.beforeCreate(event);
    syncLeaderFromRepresentative(event);
  },
  beforeUpdate(event: any) {
    focusSdgsLifecycles.beforeUpdate(event);
    syncLeaderFromRepresentative(event);
  },
};
