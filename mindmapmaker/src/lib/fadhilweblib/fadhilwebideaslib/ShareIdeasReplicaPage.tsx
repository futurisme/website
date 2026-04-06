'use client';

import { memo } from 'react';

const SHAREIDEAS_URL = '/shareideas';

function ShareIdeasReplicaPageBase() {
  return (
    <iframe
      title="shareideas"
      src={SHAREIDEAS_URL}
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
}

const ShareIdeasReplicaPage = memo(ShareIdeasReplicaPageBase);

export default ShareIdeasReplicaPage;
