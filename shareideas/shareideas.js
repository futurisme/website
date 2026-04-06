const TAB_GROUPS = [
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
              'Saat pemain mendirikan negara, muncul pop-up kustomisasi berupa: 1) Nama Negara, 2) Bentuk Pemerintahan, 3) Ideologi Negara, 4) Bendera Negara, 5) Doktrin. Setelah itu pemain spawn di map dan menempatkan ibu kota.',
            progress: 17,
          },
        ],
      },
      {
        title: 'EKONOMI',
        items: [
          { title: 'PAJAK NEGARA', description: 'Tarif pajak memengaruhi kepuasan warga, laju produksi, dan pemasukan mingguan.', progress: 41 },
          { title: 'PERDAGANGAN ANTARNEGARA', description: 'Perjanjian ekspor-impor membuka bonus sumber daya dan jalur diplomasi baru.', progress: 28 },
        ],
      },
      {
        title: 'MILITER',
        items: [
          { title: 'DOKTRIN UNIT', description: 'Pilih agresif, netral, atau defensif untuk memengaruhi AI unit ketika patroli.', progress: 35 },
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
          { title: 'RIFLEMAN', description: 'Unit dasar infanteri dengan biaya rendah dan efektif di wilayah urban.', progress: 62 },
        ],
      },
      {
        title: 'ARMORED',
        items: [
          { title: 'LIGHT TANK', description: 'Unit cepat untuk breakthrough awal, lemah terhadap anti-tank berat.', progress: 52 },
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
          { title: 'RISSET INDUSTRI', description: 'Menaikkan output pabrik dan mempercepat antrian produksi.', progress: 44 },
          { title: 'RISSET KOMUNIKASI', description: 'Meningkatkan koordinasi unit dan mengurangi delay perintah.', progress: 31 },
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
          { title: 'GURUN', description: 'Pergerakan kendaraan cepat, suplai logistik lebih boros.', progress: 75 },
          { title: 'PEGUNUNGAN', description: 'Pertahanan lebih kuat, mobilitas unit berat berkurang.', progress: 57 },
        ],
      },
    ],
  },
];

const state = {
  activeTab: TAB_GROUPS[0].id,
};

const tabsEl = document.getElementById('tabs');
const bottomNavEl = document.getElementById('bottom-nav');
const boardEl = document.getElementById('board');
const folderTemplate = document.getElementById('folder-template');
const itemTemplate = document.getElementById('item-template');

function renderSwitches(host, className) {
  host.textContent = '';
  TAB_GROUPS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = className;
    btn.type = 'button';
    btn.textContent = tab.label;
    btn.setAttribute('aria-current', String(tab.id === state.activeTab));
    btn.addEventListener('click', () => {
      state.activeTab = tab.id;
      render();
    });
    host.append(btn);
  });
}

function createItem(item) {
  const fragment = itemTemplate.content.cloneNode(true);
  const node = fragment.querySelector('.idea-item');
  const title = fragment.querySelector('.idea-title');
  const description = fragment.querySelector('.idea-description');
  const progressText = fragment.querySelector('.progress-text');
  const fill = fragment.querySelector('.progress-fill');
  const detailToggle = fragment.querySelector('.detail-toggle');

  let collapsed = false;

  title.textContent = item.title;
  description.textContent = item.description;
  progressText.textContent = `${item.progress}% selesai`;
  fill.style.width = `${Math.max(0, Math.min(100, item.progress))}%`;

  detailToggle.textContent = '▲ Collapse detail';
  detailToggle.addEventListener('click', () => {
    collapsed = !collapsed;
    node.dataset.collapsed = String(collapsed);
    detailToggle.textContent = collapsed ? '▼ Expand detail' : '▲ Collapse detail';
  });

  return fragment;
}

function createFolder(folder) {
  const fragment = folderTemplate.content.cloneNode(true);
  const root = fragment.querySelector('.folder');
  const title = fragment.querySelector('.folder-title');
  const count = fragment.querySelector('.folder-count');
  const toggle = fragment.querySelector('.folder-toggle');
  const content = fragment.querySelector('.folder-content');

  let collapsed = false;

  title.textContent = folder.title;
  count.textContent = `${folder.items.length} ITEMCARDS`;
  toggle.textContent = '▲ Collapse folder';

  folder.items.forEach((item) => content.append(createItem(item)));

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    root.dataset.collapsed = String(collapsed);
    toggle.textContent = collapsed ? '▼ Expand folder' : '▲ Collapse folder';
  });

  return fragment;
}

function renderBoard() {
  boardEl.textContent = '';
  const tab = TAB_GROUPS.find((entry) => entry.id === state.activeTab) ?? TAB_GROUPS[0];
  tab.folders.forEach((folder) => boardEl.append(createFolder(folder)));
}

function render() {
  renderSwitches(tabsEl, 'tab-btn');
  renderSwitches(bottomNavEl, 'nav-btn');
  renderBoard();
}

render();
