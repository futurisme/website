'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionGroup, Field, Input, Panel, Select, Stack, StatusChip, Textarea } from '@/lib/fadhilweblib';
import { Button } from '@/lib/fadhilweblib/client';
import {
  DEFAULT_SHARE_IDEAS_DATA,
  sanitizeShareIdeasDatabase,
  type ShareIdeasCard,
  type ShareIdeasDatabase,
} from '@/features/shareideas/shared/schema';

const SAVE_DEBOUNCE_MS = 180;
const FOLDER_OUTLINE_HACK = '#71ff3d';
const CARD_OUTLINE_AZURE = '#57e9ff';
const CARD_FILL_MAROON_DARK = 'linear-gradient(180deg, #1a0010, #100009)';

type AddMode = 'choose' | 'folder' | 'card';

type EditFolderState = {
  folderId: string;
  name: string;
} | null;

type EditCardState = {
  folderId: string;
  cardId: string;
  title: string;
  description: string;
} | null;

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function ShareIdeasReplicaPageBase() {
  const [db, setDb] = useState<ShareIdeasDatabase>(DEFAULT_SHARE_IDEAS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('choose');
  const [newFolderName, setNewFolderName] = useState('');
  const [newCardFolderId, setNewCardFolderId] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');

  const [editFolder, setEditFolder] = useState<EditFolderState>(null);
  const [editCard, setEditCard] = useState<EditCardState>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const dbRef = useRef(db);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const serverVersionRef = useRef<number | null>(null);

  const totalCards = useMemo(() => db.folders.reduce((sum, folder) => sum + folder.cards.length, 0), [db.folders]);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setError('');
        const response = await fetch('/api/shareideas', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'Gagal memuat creator.');
        }

        const payload = (await response.json()) as { data?: unknown; version?: number };
        const safe = sanitizeShareIdeasDatabase(payload.data);
        serverVersionRef.current = typeof payload.version === 'number' ? payload.version : null;
        setDb(safe);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Gagal memuat creator.');
        }
      } finally {
        hydratedRef.current = true;
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        setError('');

        const response = await fetch('/api/shareideas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: dbRef.current,
            expectedVersion: serverVersionRef.current,
          }),
        });

        if (response.status === 409) {
          const payload = (await response.json()) as { version?: number; data?: unknown };
          if (typeof payload.version === 'number') {
            serverVersionRef.current = payload.version;
          }
          if (payload.data) {
            setDb(sanitizeShareIdeasDatabase(payload.data));
          }
          setError('Perubahan bentrok dengan sesi lain. Data terbaru telah dimuat.');
          setSaveState('error');
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'Gagal menyimpan creator.');
        }

        const payload = (await response.json()) as { version?: number };
        if (typeof payload.version === 'number') {
          serverVersionRef.current = payload.version;
        }
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        setError(err instanceof Error ? err.message : 'Gagal sinkronisasi ke server.');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [db]);

  const openAddChooser = useCallback(() => {
    setAddMode('choose');
    setShowAddModal(true);
  }, []);

  const saveAddFolder = useCallback(() => {
    const name = newFolderName.trim().slice(0, 80);
    if (!name) return;

    setDb((prev) => ({
      ...prev,
      folders: [...prev.folders, { id: randomId('folder'), name, cards: [] }],
    }));

    setNewFolderName('');
    setShowAddModal(false);
    setAddMode('choose');
  }, [newFolderName]);

  const saveAddCard = useCallback(() => {
    const folderId = newCardFolderId || db.folders[0]?.id;
    const title = newCardTitle.trim().slice(0, 120);
    if (!folderId || !title) return;

    const newCard: ShareIdeasCard = {
      id: randomId('card'),
      title,
      description: '',
    };

    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (
        folder.id === folderId ? { ...folder, cards: [...folder.cards, newCard] } : folder
      )),
    }));

    setNewCardTitle('');
    setNewCardFolderId('');
    setShowAddModal(false);
    setAddMode('choose');
  }, [db.folders, newCardFolderId, newCardTitle]);

  const saveEditFolder = useCallback(() => {
    if (!editFolder) return;
    const name = editFolder.name.trim().slice(0, 80);
    if (!name) return;

    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (folder.id === editFolder.folderId ? { ...folder, name } : folder)),
    }));
    setEditFolder(null);
  }, [editFolder]);

  const saveEditCard = useCallback(() => {
    if (!editCard) return;
    const title = editCard.title.trim().slice(0, 120);
    if (!title) return;

    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => {
        if (folder.id !== editCard.folderId) return folder;
        return {
          ...folder,
          cards: folder.cards.map((card) => (
            card.id === editCard.cardId
              ? {
                  ...card,
                  title,
                  description: editCard.description.trim().slice(0, 6000),
                }
              : card
          )),
        };
      }),
    }));

    setEditCard(null);
  }, [editCard]);

  if (loading) {
    return (
      <Stack gap="sm" style={{ padding: 12 }}>
        <StatusChip label="STATUS" value="Loading" tone="neutral" />
      </Stack>
    );
  }

  return (
    <Stack gap="md" style={{ minHeight: '100%', background: '#03070f', padding: '12px 12px 92px' }}>
      <ActionGroup justify="between">
        <StatusChip label="FOLDERS" value={String(db.folders.length)} tone="neutral" />
        <StatusChip label="CARDS" value={String(totalCards)} tone="neutral" />
        <StatusChip label="SYNC" value={saveState.toUpperCase()} tone={saveState === 'error' ? 'danger' : 'accent'} />
      </ActionGroup>

      {error ? (
        <Panel style={{ borderColor: '#ff6f9175', borderWidth: 1, borderStyle: 'solid', background: '#2a0e14', padding: 10 }}>
          <p style={{ margin: 0 }}>{error}</p>
        </Panel>
      ) : null}

      {db.folders.length === 0 ? (
        <Panel style={{ borderColor: '#24e8ff66', borderWidth: 1, borderStyle: 'solid', background: '#120119', padding: 12 }}>
          <p style={{ margin: 0, color: '#9edcff' }}>Workspace masih kosong. Tekan tombol <strong>Add</strong> di bottom header.</p>
        </Panel>
      ) : null}

      {db.folders.map((folder) => {
        const folderHasExpandedCard = expandedCardId ? folder.cards.some((card) => card.id === expandedCardId) : false;
        const isFolderExpanded = expandedFolderId === folder.id || folderHasExpandedCard;
        return (
        <Panel
          key={folder.id}
          style={{
            borderColor: FOLDER_OUTLINE_HACK,
            borderWidth: 1,
            borderStyle: 'solid',
            background: '#210114',
            boxShadow: '0 0 10px #39ff1440, 0 0 18px #39ff1426',
          }}
        >
          <Stack gap="sm" style={{ padding: 12 }}>
            <ActionGroup justify="between">
              <h2 style={{ margin: 0 }}>{folder.name}</h2>
              <ActionGroup>
                <StatusChip label="ITEMCARDS" value={String(folder.cards.length)} tone="neutral" />
                <Button tone="neutral" onClick={() => setEditFolder({ folderId: folder.id, name: folder.name })}>Edit</Button>
                <Button tone="neutral" onClick={() => {
                  if (isFolderExpanded) {
                    setExpandedFolderId(null);
                    if (folderHasExpandedCard) setExpandedCardId(null);
                  } else {
                    setExpandedFolderId(folder.id);
                    if (!folderHasExpandedCard) setExpandedCardId(null);
                  }
                }}>
                  {isFolderExpanded ? '▲ Collapse' : '▼ Expand'}
                </Button>
              </ActionGroup>
            </ActionGroup>

            {isFolderExpanded ? folder.cards.map((card) => {
              const isOpen = expandedCardId === card.id;
              return (
                <Panel
                  key={card.id}
                  style={{
                    padding: 12,
                    border: `1px solid ${CARD_OUTLINE_AZURE}`,
                    background: CARD_FILL_MAROON_DARK,
                    boxShadow: '0 0 8px #57e9ff36',
                  }}
                >
                  <Stack gap="sm">
                    <ActionGroup justify="between">
                      <h3 style={{ margin: 0 }}>{card.title}</h3>
                      <ActionGroup>
                        <Button tone="neutral" onClick={() => setEditCard({ folderId: folder.id, cardId: card.id, title: card.title, description: card.description })}>
                          Edit
                        </Button>
                        <Button tone="neutral" onClick={() => {
                          if (isOpen) {
                            setExpandedCardId(null);
                          } else {
                            setExpandedCardId(card.id);
                            setExpandedFolderId(folder.id);
                          }
                        }}>
                          {isOpen ? '▲ Collapse detail' : '▼ Expand detail'}
                        </Button>
                      </ActionGroup>
                    </ActionGroup>

                    {isOpen ? <p style={{ margin: 0, color: '#ffa34c', whiteSpace: 'pre-wrap' }}>{card.description || 'Belum ada deskripsi.'}</p> : null}
                  </Stack>
                </Panel>
              );
            }) : null}
          </Stack>
        </Panel>
      )})}

      {showAddModal ? (
        <div style={{ position: 'fixed', inset: 0, background: '#01020ddd', zIndex: 40, display: 'grid', placeItems: 'center', padding: 12 }}>
          <Panel style={{ width: 'min(540px, 100%)', border: '1px solid #24e8ff88', background: '#0e1526' }}>
            <Stack gap="sm" style={{ padding: 12 }}>
              {addMode === 'choose' ? (
                <>
                  <h3 style={{ margin: 0 }}>Add</h3>
                  <ActionGroup>
                    <Button tone="accent" onClick={() => setAddMode('folder')}>Add Folder</Button>
                    <Button tone="accent" onClick={() => setAddMode('card')}>Add Card</Button>
                  </ActionGroup>
                </>
              ) : null}

              {addMode === 'folder' ? (
                <>
                  <Field label="Nama folder">
                    <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Contoh: Pemerintahan" />
                  </Field>
                  <ActionGroup>
                    <Button tone="accent" onClick={saveAddFolder}>Simpan folder</Button>
                    <Button tone="neutral" onClick={() => setAddMode('choose')}>Kembali</Button>
                  </ActionGroup>
                </>
              ) : null}

              {addMode === 'card' ? (
                <>
                  <Field label="Folder tujuan">
                    <Select value={newCardFolderId || db.folders[0]?.id || ''} onChange={(event) => setNewCardFolderId(event.target.value)}>
                      {db.folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Judul card">
                    <Input value={newCardTitle} onChange={(event) => setNewCardTitle(event.target.value)} placeholder="Contoh: Sistem Diplomasi" />
                  </Field>
                  <ActionGroup>
                    <Button tone="accent" onClick={saveAddCard} disabled={db.folders.length === 0}>Simpan card</Button>
                    <Button tone="neutral" onClick={() => setAddMode('choose')}>Kembali</Button>
                  </ActionGroup>
                  {db.folders.length === 0 ? <p style={{ margin: 0 }}>Buat folder dulu sebelum menambah card.</p> : null}
                </>
              ) : null}

              <ActionGroup>
                <Button tone="neutral" onClick={() => { setShowAddModal(false); setAddMode('choose'); }}>Tutup</Button>
              </ActionGroup>
            </Stack>
          </Panel>
        </div>
      ) : null}

      {editFolder ? (
        <div style={{ position: 'fixed', inset: 0, background: '#01020ddd', zIndex: 45, display: 'grid', placeItems: 'center', padding: 12 }}>
          <Panel style={{ width: 'min(540px, 100%)', border: '1px solid #24e8ff88', background: '#0e1526' }}>
            <Stack gap="sm" style={{ padding: 12 }}>
              <h3 style={{ margin: 0 }}>Edit Folder</h3>
              <Field label="Nama folder">
                <Input value={editFolder.name} onChange={(event) => setEditFolder((prev) => (prev ? { ...prev, name: event.target.value } : prev))} />
              </Field>
              <ActionGroup>
                <Button tone="accent" onClick={saveEditFolder}>Simpan</Button>
                <Button tone="neutral" onClick={() => setEditFolder(null)}>Batal</Button>
              </ActionGroup>
            </Stack>
          </Panel>
        </div>
      ) : null}

      {editCard ? (
        <div style={{ position: 'fixed', inset: 0, background: '#01020ddd', zIndex: 50, display: 'grid', placeItems: 'center', padding: 12 }}>
          <Panel style={{ width: 'min(640px, 100%)', border: '1px solid #24e8ff88', background: '#0e1526' }}>
            <Stack gap="sm" style={{ padding: 12 }}>
              <h3 style={{ margin: 0 }}>Edit Card</h3>
              <Field label="Judul card">
                <Input value={editCard.title} onChange={(event) => setEditCard((prev) => (prev ? { ...prev, title: event.target.value } : prev))} />
              </Field>
              <Field label="Deskripsi card">
                <Textarea rows={8} value={editCard.description} onChange={(event) => setEditCard((prev) => (prev ? { ...prev, description: event.target.value } : prev))} />
              </Field>
              <ActionGroup>
                <Button tone="accent" onClick={saveEditCard}>Simpan</Button>
                <Button tone="neutral" onClick={() => setEditCard(null)}>Batal</Button>
              </ActionGroup>
            </Stack>
          </Panel>
        </div>
      ) : null}

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, borderTop: '1px solid #24e8ff55', background: '#040814f5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 10, display: 'flex', justifyContent: 'center' }}>
          <Button tone="accent" onClick={openAddChooser}>Add</Button>
        </div>
      </div>
    </Stack>
  );
}

const ShareIdeasReplicaPage = memo(ShareIdeasReplicaPageBase);

export default ShareIdeasReplicaPage;
