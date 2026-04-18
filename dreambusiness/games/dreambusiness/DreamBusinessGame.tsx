'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_PROFILE_DRAFT,
  createInitialGameState,
  formatDateFromDays,
  formatMoneyCompact,
  getCompanyValuation,
  getSharePrice,
  simulateTick,
  type GameState,
} from '@/features/gameplay/simulation-engine';
import styles from './dreambusiness.module.css';

type CompanySummary = {
  key: string;
  name: string;
  cash: number;
  sharePrice: number;
  valuation: number;
  marketShare: number;
};

type NewsSeverity = 'normal' | 'high' | 'critical';

type NewsItem = {
  id: string;
  day: number;
  dateLabel: string;
  category: string;
  severity: NewsSeverity;
  headline: string;
  detail: string;
  score: number;
};

function summarizeTopCompanies(game: GameState): CompanySummary[] {
  return Object.values(game.companies)
    .map((company) => ({
      key: company.key,
      name: company.name,
      cash: company.cash,
      sharePrice: getSharePrice(company),
      valuation: getCompanyValuation(company),
      marketShare: company.marketShare,
    }))
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, 6);
}

export default function DreamBusinessGame() {
  const [game, setGame] = useState(() => createInitialGameState(DEFAULT_PROFILE_DRAFT));
  const [autoPlay, setAutoPlay] = useState(false);
  const [activeFrame, setActiveFrame] = useState<'main' | 'news'>('main');
  const previousPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      setGame((current) => simulateTick(current));
    }, 200);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  const topCompanies = useMemo(() => summarizeTopCompanies(game), [game]);
  const news = useMemo<NewsItem[]>(() => {
    const keywordRules = [
      { category: 'Pergantian CEO', regex: /\bCEO\b|chief executive|direktur utama|pergantian pimpinan|mengganti pimpinan/i, base: 7 },
      { category: 'Investasi Besar', regex: /investasi|berkomitmen|modal|pendanaan|funding|suntikan dana/i, base: 4 },
      { category: 'Penjualan Besar', regex: /menjual|penjualan|melepas|divestasi|buyback|akuisisi/i, base: 4 },
      { category: 'Saham Ekstrem', regex: /saham|listing|harga|valuasi|anjlok|melonjak|drastis/i, base: 3 },
    ];
    const intensityRegex = /rekor|terbesar|di atas rata-rata|sangat mahal|anjlok|melonjak|drastis|panic|euforia/i;
    const byKey = new Map<string, NewsItem>();

    game.activityFeed.forEach((entry, idx) => {
      const [maybeDate, ...restParts] = entry.split(':');
      const text = restParts.length > 0 ? restParts.join(':').trim() : entry.trim();
      const dateLabel = restParts.length > 0 ? maybeDate.trim() : formatDateFromDays(game.elapsedDays);
      const matchedRule = keywordRules.find((rule) => rule.regex.test(text));
      if (!matchedRule) return;
      const intensityBoost = intensityRegex.test(text) ? 3 : 0;
      const score = matchedRule.base + intensityBoost;
      const severity: NewsSeverity = score >= 8 ? 'critical' : score >= 6 ? 'high' : 'normal';
      const dedupeKey = `${dateLabel}-${matchedRule.category}-${text.slice(0, 48)}`;
      byKey.set(dedupeKey, {
        id: `feed-${idx}-${dedupeKey}`,
        day: idx,
        dateLabel,
        category: matchedRule.category,
        severity,
        headline: text,
        detail: `Sinyal ${matchedRule.category.toLowerCase()} terdeteksi dari activity log simulator.`,
        score,
      });
    });

    const allCompanies = Object.values(game.companies);
    const averageSharePrice = allCompanies.length === 0
      ? 1
      : allCompanies.reduce((sum, company) => sum + getSharePrice(company), 0) / allCompanies.length;

    allCompanies.forEach((company) => {
      const current = getSharePrice(company);
      const previous = previousPricesRef.current[company.key];
      previousPricesRef.current[company.key] = current;
      if (!previous || previous <= 0) return;
      const delta = ((current - previous) / previous) * 100;
      const isBigMove = Math.abs(delta) >= Math.max(12, averageSharePrice > 100 ? 8 : 12);
      if (!isBigMove) return;
      const severity: NewsSeverity = Math.abs(delta) >= 24 ? 'critical' : 'high';
      const headline = `${company.name} ${delta > 0 ? 'melonjak' : 'anjlok'} ${Math.abs(delta).toFixed(1)}%`;
      const key = `${formatDateFromDays(game.elapsedDays)}-${company.key}-price`;
      byKey.set(key, {
        id: `price-${company.key}-${game.elapsedDays}`,
        day: game.elapsedDays,
        dateLabel: formatDateFromDays(game.elapsedDays),
        category: 'Saham Ekstrem',
        severity,
        headline,
        detail: `Harga saham berubah dari $${previous.toFixed(2)} ke $${current.toFixed(2)}.`,
        score: severity === 'critical' ? 9 : 7,
      });
    });

    return [...byKey.values()]
      .sort((a, b) => b.day - a.day || b.score - a.score)
      .slice(0, 5);
  }, [game]);

  const newsByDate = useMemo(() => news.reduce<Record<string, NewsItem[]>>((acc, item) => {
    if (!acc[item.dateLabel]) acc[item.dateLabel] = [];
    acc[item.dateLabel].push(item);
    return acc;
  }, {}), [news]);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1>DreamBusiness</h1>
        <p>Antarmuka game berbasis business engine simulator.</p>
        <div className={styles.actions}>
          <button type="button" onClick={() => setGame((current) => simulateTick(current))}>Simulate 1 Tick</button>
          <button type="button" onClick={() => setGame((current) => {
            let next = current;
            for (let i = 0; i < 25; i++) next = simulateTick(next);
            return next;
          })}>Simulate 25 Tick</button>
          <button type="button" onClick={() => setAutoPlay((active) => !active)}>
            {autoPlay ? 'Stop Auto' : 'Start Auto'}
          </button>
          <button type="button" onClick={() => { setAutoPlay(false); setGame(createInitialGameState(DEFAULT_PROFILE_DRAFT)); }}>
            Reset
          </button>
          <button type="button" onClick={() => setActiveFrame((current) => current === 'news' ? 'main' : 'news')}>
            {activeFrame === 'news' ? 'Back to Mainframe' : 'News'}
          </button>
        </div>
      </header>

      <section className={styles.stats}>
        <article><h2>Hari Simulasi</h2><strong>{game.elapsedDays}</strong><small>{formatDateFromDays(game.elapsedDays)}</small></article>
        <article><h2>Cash Player</h2><strong>{formatMoneyCompact(game.player.cash)}</strong><small>{game.player.name}</small></article>
        <article><h2>Jumlah NPC</h2><strong>{game.npcs.length}</strong><small>investor aktif</small></article>
        <article><h2>Lisensi App</h2><strong>{game.appStoreLicenseRequests.length}</strong><small>request total</small></article>
      </section>

      {activeFrame === 'main' ? (
        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Top Company Snapshot</h2>
            <ul>
              {topCompanies.map((company) => (
                <li key={company.key}>
                  <div>
                    <strong>{company.name}</strong>
                    <small>{company.key}</small>
                  </div>
                  <div>
                    <span>Valuation: {formatMoneyCompact(company.valuation)}</span>
                    <span>Share: ${company.sharePrice.toFixed(2)}</span>
                    <span>MS: {company.marketShare.toFixed(1)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : (
        <section className={styles.newsFrame}>
          <article className={styles.newsPanel}>
            <div className={styles.newsHeading}>
              <h2>News (5 Latest Major Events)</h2>
              <p>Filter cerdas hanya menampilkan kejadian besar agar feed tidak spam.</p>
            </div>
            {news.length === 0 ? (
              <p className={styles.newsEmpty}>Belum ada peristiwa besar. Jalankan simulasi untuk menghasilkan news.</p>
            ) : (
              <div className={styles.newsTimeline}>
                {Object.entries(newsByDate).map(([date, items]) => (
                  <section key={date} className={styles.newsDayGroup}>
                    <h3>{date}</h3>
                    <ul>
                      {items.map((item) => (
                        <li key={item.id} data-severity={item.severity}>
                          <div>
                            <strong>{item.category}</strong>
                            <small>{item.severity === 'critical' ? 'Critical' : item.severity === 'high' ? 'High Impact' : 'Normal'}</small>
                          </div>
                          <p>{item.headline}</p>
                          <span>{item.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}
