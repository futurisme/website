'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionGroup,
  Container,
  EmptyState,
  HeaderShell,
  Input,
  Notice,
  Section,
  Stack,
  Surface,
  Textarea,
  ThemeScope,
} from '@/lib/fadhilweblib';
import {
  DEFAULT_GAME_IDEA_DATA,
  GAME_IDEA_NAV_ORDER,
  GAME_IDEA_STORAGE_KEY,
  sanitizeGameIdeaDatabase,
  type GameIdeaDatabase,
  type GameIdeaItem,
  type GameIdeaNav,
} from '@/features/game-ideas/shared/schema';
import { decodeFadhilArchive, encodeFadhilArchive } from '@/features/maps/shared/fadhil-archive';

type Draft = {
  name: string;
  tag: string;
  desc: string;
  stats: string;
};

const EMPTY_DB: GameIdeaDatabase = {
  govt: { title: 'CODEX: GOVT', categories: [], data: {} },
  units: { title: 'CODEX: UNITS', categories: [], data: {} },
  tech: { title: 'CODEX: TECH', categories: [], data: {} },
  econ: { title: 'CODEX: ECON', categories: [], data: {} },
};

const BOTTOM_LABELS: Record<GameIdeaNav, string> = {
  govt: 'CODEX: GOVT',
  units: 'CODEX: UNITS',
  tech: 'CODEX: TECH',
  econ: 'CODEX: ECON',
};

function parseStats(raw: string) {
  const stats: Record<string, string> = {};
  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [key, ...rest] = part.split(':');
      const value = rest.join(':').trim();
      if (!key || !value) return;
      stats[key.trim().slice(0, 32)] = value.slice(0, 80);
    });
  return stats;
}

function formatStats(stats: Record<string, string>) {
  return Object.entries(stats)
    .map(([key, value]) => `${key}:${value}`)
    .join(', ');
}

function createItemId() {
  return `item-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export default function GameIdeasPage() {
  const [db, setDb] = useState<GameIdeaDatabase>(EMPTY_DB);
  const [nav, setNav] = useState<GameIdeaNav>('govt');
  const [category, setCategory] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [draft, setDraft] = useState<Draft>({ name: '', tag: '', desc: '', stats: '' });
  const [notice, setNotice] = useState<string>('READY');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(GAME_IDEA_STORAGE_KEY);
    if (!raw) {
      const seeded = sanitizeGameIdeaDatabase(DEFAULT_GAME_IDEA_DATA);
      setDb(seeded);
      setCategory(seeded.govt.categories[0] ?? '');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const safe = sanitizeGameIdeaDatabase(parsed);
      setDb(safe);
      setCategory(safe.govt.categories[0] ?? '');
    } catch {
      const seeded = sanitizeGameIdeaDatabase(DEFAULT_GAME_IDEA_DATA);
      setDb(seeded);
      setCategory(seeded.govt.categories[0] ?? '');
      setNotice('Storage invalid, database reset to safe default.');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GAME_IDEA_STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    const section = db[nav];
    if (!section) return;
    const categories = section.categories;
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? '');
    }
  }, [nav, category, db]);

  const currentSection = db[nav];
  const categories = currentSection?.categories ?? [];
  const items = category ? currentSection?.data[category] ?? [] : [];

  const totals = useMemo(() => {
    const categoryCount = categories.length;
    const itemCount = Object.values(currentSection?.data ?? {}).reduce((sum, list) => sum + list.length, 0);
    return { categoryCount, itemCount };
  }, [categories.length, currentSection]);

  const addCategory = () => {
    const normalized = categoryDraft.trim().toUpperCase().replace(/\s+/g, ' ').slice(0, 32);
    if (!normalized) return;

    setDb((prev) => {
      const section = prev[nav];
      if (section.categories.includes(normalized)) return prev;
      return {
        ...prev,
        [nav]: {
          ...section,
          categories: [...section.categories, normalized],
          data: { ...section.data, [normalized]: [] },
        },
      };
    });

    setCategory(normalized);
    setCategoryDraft('');
    setNotice(`Category ${normalized} added.`);
  };

  const addIdea = () => {
    if (!category || !draft.name.trim()) return;

    const nextItem: GameIdeaItem = {
      id: createItemId(),
      name: draft.name.trim().slice(0, 120),
      tag: draft.tag.trim().slice(0, 32),
      desc: draft.desc.trim(),
      stats: parseStats(draft.stats),
    };

    setDb((prev) => {
      const section = prev[nav];
      const list = section.data[category] ?? [];
      return {
        ...prev,
        [nav]: {
          ...section,
          data: { ...section.data, [category]: [nextItem, ...list] },
        },
      };
    });

    setDraft({ name: '', tag: '', desc: '', stats: '' });
    setNotice(`Idea ${nextItem.name} saved.`);
  };

  const exportArchive = async () => {
    const encoded = await encodeFadhilArchive(db, 'featurelib-gameideas');
    const blob = new Blob([encoded], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-ideas-${Date.now()}.fAdHiL`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Export complete (.fAdHiL).');
  };

  const importArchive = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = String(reader.result ?? '');
        const decoded = await decodeFadhilArchive(raw);
        const payload = sanitizeGameIdeaDatabase(decoded.payload);
        setDb(payload);
        setNav('govt');
        setCategory(payload.govt.categories[0] ?? '');
        setNotice('Import complete.');
      } catch {
        setNotice('Import failed: invalid .fAdHiL archive.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ThemeScope theme="game" style={{ minHeight: '100dvh', background: '#020617', color: '#e2e8f0' }}>
      <Stack gap="sm" style={{ minHeight: '100dvh', paddingBottom: '3.2rem' }}>
        <Surface
          tone="neutral"
          density="compact"
          style={{ position: 'sticky', top: 0, zIndex: 30, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
        >
          <Container maxWidth="full">
            <HeaderShell
              compact
              eyebrow="/game-ideas"
              title="Game Ideas"
              subtitle="Minimalist codex board"
              meta={`${totals.itemCount} ideas`}
              actions={<span style={{ fontSize: '0.78rem', opacity: 0.9 }}>{BOTTOM_LABELS[nav]}</span>}
            />
          </Container>
        </Surface>

        <Container maxWidth="lg" style={{ paddingTop: '0.2rem' }}>
          <Stack gap="sm">
            <Notice tone="info" title="State" description={notice} />

            <Section
              tone="neutral"
              density="compact"
              eyebrow="Catalog"
              title="Categories"
              description="Create and switch idea lanes"
            >
              <Stack gap="sm">
                <ActionGroup gap="xs" wrap>
                  {categories.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setCategory(entry)}
                      style={{
                        borderRadius: 999,
                        border: '1px solid rgba(56,189,248,0.45)',
                        background: entry === category ? 'rgba(14,165,233,0.22)' : 'rgba(2,6,23,0.4)',
                        color: '#e2e8f0',
                        padding: '0.28rem 0.68rem',
                        fontSize: '0.78rem',
                      }}
                    >
                      {entry}
                    </button>
                  ))}
                </ActionGroup>

                <ActionGroup gap="xs" wrap={false}>
                  <Input
                    placeholder="NEW CATEGORY"
                    value={categoryDraft}
                    onChange={(event) => setCategoryDraft(event.target.value)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(56,189,248,0.55)',
                      background: 'rgba(14,165,233,0.22)',
                      color: '#e2e8f0',
                      padding: '0.36rem 0.78rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    Add
                  </button>
                </ActionGroup>
              </Stack>
            </Section>

            <Section tone="neutral" density="compact" eyebrow="Launch" title="Create idea" description="Small and fast input deck">
              <Stack gap="sm">
                <Input placeholder="Idea name" value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Tag" value={draft.tag} onChange={(e) => setDraft((prev) => ({ ...prev, tag: e.target.value }))} size="sm" />
                <Textarea placeholder="Description" rows={3} value={draft.desc} onChange={(e) => setDraft((prev) => ({ ...prev, desc: e.target.value }))} />
                <Input
                  placeholder="stats format: power:80,range:20"
                  value={draft.stats}
                  onChange={(e) => setDraft((prev) => ({ ...prev, stats: e.target.value }))}
                  size="sm"
                />
                <ActionGroup gap="xs" wrap>
                  <button
                    type="button"
                    onClick={addIdea}
                    style={{ borderRadius: 10, border: '1px solid rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.2)', color: '#dcfce7', padding: '0.36rem 0.78rem' }}
                  >
                    Save idea
                  </button>
                  <button
                    type="button"
                    onClick={exportArchive}
                    style={{ borderRadius: 10, border: '1px solid rgba(56,189,248,0.5)', background: 'rgba(56,189,248,0.18)', color: '#cffafe', padding: '0.36rem 0.78rem' }}
                  >
                    Export .fAdHiL
                  </button>
                  <label
                    style={{ borderRadius: 10, border: '1px solid rgba(236,72,153,0.5)', background: 'rgba(236,72,153,0.16)', color: '#fce7f3', padding: '0.36rem 0.78rem', cursor: 'pointer' }}
                  >
                    Import .fAdHiL
                    <input
                      type="file"
                      accept=".fAdHiL,.txt"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) importArchive(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </ActionGroup>
              </Stack>
            </Section>

            <Section tone="neutral" density="compact" eyebrow="Results" title={category || 'No category selected'}>
              {items.length === 0 ? (
                <EmptyState title="No ideas yet" description="Create the first idea from the form above." />
              ) : (
                <Stack gap="sm">
                  {items.map((item) => (
                    <Surface key={item.id} tone="neutral" density="compact">
                      <Stack gap="xs">
                        <HeaderShell compact title={item.name} subtitle={item.desc || 'No description'} meta={item.tag || '-'} />
                        <Notice tone="neutral" title="Stats" description={formatStats(item.stats) || 'No stats'} />
                      </Stack>
                    </Surface>
                  ))}
                </Stack>
              )}
            </Section>
          </Stack>
        </Container>

        <Surface
          tone="neutral"
          density="compact"
          style={{
            position: 'fixed',
            bottom: 0,
            insetInline: 0,
            zIndex: 40,
            borderRadius: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            padding: '0.28rem 0.5rem',
          }}
        >
          <ActionGroup gap="xs" wrap={false} justify="between">
            {GAME_IDEA_NAV_ORDER.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setNav(entry)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  border: '1px solid rgba(56,189,248,0.45)',
                  background: entry === nav ? 'rgba(56,189,248,0.2)' : 'rgba(2,6,23,0.4)',
                  color: '#e2e8f0',
                  fontSize: '0.76rem',
                  minHeight: '2rem',
                }}
              >
                {BOTTOM_LABELS[entry]}
              </button>
            ))}
          </ActionGroup>
        </Surface>
      </Stack>
    </ThemeScope>
  );
}
