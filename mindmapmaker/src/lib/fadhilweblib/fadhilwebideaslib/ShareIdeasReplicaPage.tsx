'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionGroup, Field, Input, Panel, Stack, StatusChip, Textarea } from '@/lib/fadhilweblib';
import { Button } from '@/lib/fadhilweblib/client';
import {
  DEFAULT_SHARE_IDEAS_DATA,
  sanitizeShareIdeasDatabase,
  type ShareIdeasCard,
  type ShareIdeasDatabase,
} from '@/features/shareideas/shared/schema';

const SAVE_DEBOUNCE_MS = 180;

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function ShareIdeasReplicaPageBase() {
  const [db, setDb] = useState<ShareIdeasDatabase>(DEFAULT_SHARE_IDEAS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [folderName, setFolderName] = useState('');
  const [cardDrafts, setCardDrafts] = useState<Record<string, { title: string }>>({});
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  const dbRef = useRef(db);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const serverVersionRef = useRef<number | null>(null);

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

  const totalCards = useMemo(() => db.folders.reduce((sum, folder) => sum + folder.cards.length, 0), [db.folders]);

  const addFolder = useCallback(() => {
    const name = folderName.trim().slice(0, 80);
    if (!name) return;

    setDb((prev) => ({
      ...prev,
      folders: [...prev.folders, { id: randomId('folder'), name, cards: [] }],
    }));
    setFolderName('');
  }, [folderName]);

  const addCard = useCallback((folderId: string) => {
    const title = (cardDrafts[folderId]?.title ?? '').trim().slice(0, 120);
    if (!title) return;

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

    setCardDrafts((prev) => ({
      ...prev,
      [folderId]: { title: '' },
    }));
    setOpenCards((prev) => ({ ...prev, [newCard.id]: true }));
  }, [cardDrafts]);

  const updateCardDescription = useCallback((folderId: string, cardId: string, description: string) => {
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => {
        if (folder.id !== folderId) return folder;
        return {
          ...folder,
          cards: folder.cards.map((card) => (
            card.id === cardId ? { ...card, description: description.slice(0, 6000) } : card
          )),
        };
      }),
    }));
  }, []);

  if (loading) {
    return (
      <Stack gap="sm" style={{ padding: 12 }}>
        <StatusChip label="STATUS" value="Loading" tone="neutral" />
      </Stack>
    );
  }

  return (
    <Stack gap="md" style={{ minHeight: '100%', background: '#03070f', padding: 12 }}>
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

      <Panel style={{ borderColor: '#24e8ff66', borderWidth: 1, borderStyle: 'solid', background: '#120119' }}>
        <Stack gap="sm" style={{ padding: 12 }}>
          <Field label="Add folder">
            <Input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Nama folder baru"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addFolder();
                }
              }}
            />
          </Field>
          <ActionGroup>
            <Button tone="accent" onClick={addFolder}>Tambah folder</Button>
          </ActionGroup>
        </Stack>
      </Panel>

      {db.folders.map((folder) => (
        <Panel key={folder.id} style={{ borderColor: '#fb4e6f66', borderWidth: 1, borderStyle: 'solid', background: '#210114' }}>
          <Stack gap="sm" style={{ padding: 12 }}>
            <ActionGroup justify="between">
              <h2 style={{ margin: 0 }}>{folder.name}</h2>
              <StatusChip label="ITEMCARDS" value={String(folder.cards.length)} tone="neutral" />
            </ActionGroup>

            <Field label={`Add card in ${folder.name}`}>
              <Input
                value={cardDrafts[folder.id]?.title ?? ''}
                onChange={(event) =>
                  setCardDrafts((prev) => ({
                    ...prev,
                    [folder.id]: { title: event.target.value },
                  }))
                }
                placeholder="Judul card"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCard(folder.id);
                  }
                }}
              />
            </Field>

            <ActionGroup>
              <Button tone="accent" onClick={() => addCard(folder.id)}>Tambah card</Button>
            </ActionGroup>

            {folder.cards.map((card) => {
              const isOpen = openCards[card.id] ?? true;
              return (
                <Panel key={card.id} style={{ padding: 12, border: '1px solid #24e8ff66', background: '#120119' }}>
                  <Stack gap="sm">
                    <ActionGroup justify="between">
                      <h3 style={{ margin: 0 }}>{card.title}</h3>
                      <Button tone="neutral" onClick={() => setOpenCards((prev) => ({ ...prev, [card.id]: !isOpen }))}>
                        {isOpen ? '▲ Collapse detail' : '▼ Expand detail'}
                      </Button>
                    </ActionGroup>

                    {isOpen ? (
                      <Field label="Deskripsi card">
                        <Textarea
                          value={card.description}
                          onChange={(event) => updateCardDescription(folder.id, card.id, event.target.value)}
                          rows={5}
                          placeholder="Isi deskripsi card..."
                        />
                      </Field>
                    ) : null}
                  </Stack>
                </Panel>
              );
            })}
          </Stack>
        </Panel>
      ))}
    </Stack>
  );
}

const ShareIdeasReplicaPage = memo(ShareIdeasReplicaPageBase);

export default ShareIdeasReplicaPage;
