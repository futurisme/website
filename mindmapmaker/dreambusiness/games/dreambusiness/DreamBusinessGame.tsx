'use client';

import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      setGame((current) => simulateTick(current));
    }, 200);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  const topCompanies = useMemo(() => summarizeTopCompanies(game), [game]);
  const feed = useMemo(() => game.activityFeed.slice(-8).reverse(), [game]);

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
        </div>
      </header>

      <section className={styles.stats}>
        <article><h2>Hari Simulasi</h2><strong>{game.elapsedDays}</strong><small>{formatDateFromDays(game.elapsedDays)}</small></article>
        <article><h2>Cash Player</h2><strong>{formatMoneyCompact(game.player.cash)}</strong><small>{game.player.name}</small></article>
        <article><h2>Jumlah NPC</h2><strong>{game.npcs.length}</strong><small>investor aktif</small></article>
        <article><h2>Lisensi App</h2><strong>{game.appStoreLicenseRequests.length}</strong><small>request total</small></article>
      </section>

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

        <article className={styles.card}>
          <h2>Activity Feed (Latest)</h2>
          <ul>
            {feed.length === 0 ? <li>Belum ada activity.</li> : feed.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
          </ul>
        </article>
      </section>
    </main>
  );
}
