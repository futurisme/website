'use client';

import { memo } from 'react';
import { ShareIdeasPage } from '@/shareideas';

/**
 * Runtime utama untuk fitur /shareideas.
 * Tidak lagi bergantung pada route /game-ideas agar replikasi berdiri mandiri.
 */
function ShareIdeasReplicaPageBase() {
  return <ShareIdeasPage />;
}

const ShareIdeasReplicaPage = memo(ShareIdeasReplicaPageBase);

export default ShareIdeasReplicaPage;
