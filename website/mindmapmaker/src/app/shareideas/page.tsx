import dynamic from 'next/dynamic';

const ShareIdeasReplicaPage = dynamic(
  () => import('@/lib/fadhilweblib/fadhilwebideaslib').then((mod) => mod.ShareIdeasReplicaPage),
  {
    loading: () => (
      <main style={{ padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
        Menyiapkan ShareIdeas...
      </main>
    ),
  }
);

export default function ShareIdeasPage() {
  return <ShareIdeasReplicaPage />;
}
