'use client';

import { memo, useMemo, useState } from 'react';
import { ActionGroup, Button, Panel, ProgressBar, Stack, StatusChip } from '..';

type IdeaItem = {
  title: string;
  description: string;
  progress: number;
};

type IdeaFolder = {
  title: string;
  items: IdeaItem[];
};

type IdeaTab = {
  id: string;
  label: string;
  folders: IdeaFolder[];
};

const IDEA_TABS: IdeaTab[] = [
  {
    id: 'mekanisme',
    label: 'MEKANISME GAME',
    folders: [
      {
        title: 'PEMERINTAHAN',
        items: [
          {
            title: 'SISTEM PENDIRIAN NEGARA',
            description:
              'Saat pemain mendirikan negara, muncul pop up kustomisasi: nama negara, bentuk pemerintahan, ideologi, bendera, dan doktrin. Setelah itu pemain spawn di map lalu menempatkan ibu kota.',
            progress: 17,
          },
        ],
      },
      {
        title: 'EKONOMI',
        items: [
          {
            title: 'PERDAGANGAN ANTARNEGARA',
            description: 'Setiap rute dagang meningkatkan pemasukan dan membuka opsi diplomasi baru.',
            progress: 28,
          },
        ],
      },
    ],
  },
  {
    id: 'unit',
    label: 'INFO UNIT',
    folders: [
      {
        title: 'INFANTERI',
        items: [
          {
            title: 'RIFLEMAN',
            description: 'Unit dasar untuk area urban, biaya murah, dan waktu latih cepat.',
            progress: 62,
          },
        ],
      },
    ],
  },
  {
    id: 'riset',
    label: 'INFO RISET',
    folders: [
      {
        title: 'POHON TEKNOLOGI',
        items: [
          {
            title: 'RISSET INDUSTRI',
            description: 'Menaikkan output pabrik serta mempercepat antrian produksi.',
            progress: 44,
          },
        ],
      },
    ],
  },
  {
    id: 'map',
    label: 'INFO MAP',
    folders: [
      {
        title: 'BIOMA',
        items: [
          {
            title: 'PEGUNUNGAN',
            description: 'Pertahanan meningkat, mobilitas tank menurun.',
            progress: 57,
          },
        ],
      },
    ],
  },
];

function ShareIdeasReplicaPageBase() {
  const [activeTab, setActiveTab] = useState(IDEA_TABS[0]?.id ?? 'mekanisme');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  const activeData = useMemo(() => IDEA_TABS.find((tab) => tab.id === activeTab) ?? IDEA_TABS[0], [activeTab]);

  return (
    <Stack gap="md" style={{ minHeight: '100%', background: '#03070f', padding: 12 }}>
      <ActionGroup>
        {IDEA_TABS.map((tab) => (
          <Button
            key={tab.id}
            tone={tab.id === activeTab ? 'accent' : 'neutral'}
            onClick={() => setActiveTab(tab.id)}
            aria-current={tab.id === activeTab ? 'true' : 'false'}
          >
            {tab.label}
          </Button>
        ))}
      </ActionGroup>

      {activeData?.folders.map((folder) => {
        const folderKey = `${activeData.id}-${folder.title}`;
        const isFolderCollapsed = collapsedFolders[folderKey] ?? false;

        return (
          <Panel key={folderKey} style={{ borderColor: '#fb4e6f66', borderWidth: 1, borderStyle: 'solid', background: '#210114' }}>
            <Stack gap="sm" style={{ padding: 12 }}>
              <ActionGroup justify="between">
                <h2 style={{ margin: 0 }}>{folder.title}</h2>
                <StatusChip label="ITEMCARDS" value={String(folder.items.length)} tone="neutral" />
              </ActionGroup>

              <Button
                tone="neutral"
                onClick={() =>
                  setCollapsedFolders((prev) => ({
                    ...prev,
                    [folderKey]: !isFolderCollapsed,
                  }))
                }
              >
                {isFolderCollapsed ? '▼ Expand folder' : '▲ Collapse folder'}
              </Button>

              {!isFolderCollapsed
                ? folder.items.map((item) => {
                    const itemKey = `${folderKey}-${item.title}`;
                    const isItemCollapsed = collapsedItems[itemKey] ?? false;

                    return (
                      <Panel key={itemKey} style={{ padding: 12, border: '1px solid #24e8ff66', background: '#120119' }}>
                        <Stack gap="sm">
                          <ActionGroup justify="between">
                            <h3 style={{ margin: 0 }}>{item.title}</h3>
                            <Button
                              tone="neutral"
                              onClick={() =>
                                setCollapsedItems((prev) => ({
                                  ...prev,
                                  [itemKey]: !isItemCollapsed,
                                }))
                              }
                            >
                              {isItemCollapsed ? '▼ Expand detail' : '▲ Collapse detail'}
                            </Button>
                          </ActionGroup>

                          {!isItemCollapsed ? (
                            <>
                              <p style={{ margin: 0, color: '#ffa34c', lineHeight: 1.5 }}>{item.description}</p>
                              <ProgressBar
                                label="Progress"
                                value={item.progress}
                                max={100}
                                tone="accent"
                                showValue
                              />
                            </>
                          ) : null}
                        </Stack>
                      </Panel>
                    );
                  })
                : null}
            </Stack>
          </Panel>
        );
      })}
    </Stack>
  );
}

const ShareIdeasReplicaPage = memo(ShareIdeasReplicaPageBase);

export default ShareIdeasReplicaPage;
