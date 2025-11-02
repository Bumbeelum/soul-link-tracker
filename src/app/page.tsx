"use client";

import { useAppStore } from "@/state/store";
import Link from "next/link";
import { useMemo } from "react";

export default function Dashboard() {
  const pairs = useAppStore((state) => state.pairs);

  const stats = useMemo(() => {
    const pairsArray = Object.values(pairs);
    const alive = pairsArray.filter((p) => p.status === "Alive").length;
    const dead = pairsArray.filter((p) => p.status === "Dead").length;
    const total = pairsArray.length;

    const recentPairs = pairsArray
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return { alive, dead, total, recentPairs };
  }, [pairs]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-poke-accent mb-2">
          Dashboard
        </h1>
        <p className="text-slate-400">
          Track your Soul-Link journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            Total Pairs
          </h3>
          <p className="text-4xl font-bold text-slate-100">{stats.total}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            Active Pairs
          </h3>
          <p className="text-4xl font-bold text-green-400">{stats.alive}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            Fallen Pairs
          </h3>
          <p className="text-4xl font-bold text-red-400">{stats.dead}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Recent Pairs</h2>
          <Link href="/pairs" className="btn-primary">
            View All Pairs
          </Link>
        </div>

        {stats.recentPairs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No pairs created yet</p>
            <Link href="/pairs" className="btn-primary">
              Create Your First Pair
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentPairs.map((pair) => (
              <div
                key={pair.id}
                className="bg-poke-dark rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex gap-4 items-center">
                  <span className="text-2xl">
                    {pair.status === "Dead" ? "💀" : "💚"}
                  </span>
                  <div>
                    <div className="flex gap-2 text-slate-100 font-semibold">
                      <span>{pair.player1.name}</span>
                      <span className="text-poke-accent">×</span>
                      <span>{pair.player2.name}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {pair.player1.primaryType} / {pair.player2.primaryType}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {new Date(pair.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-slate-100 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link href="/pairs" className="btn-primary w-full block text-center">
              Manage Pairs
            </Link>
            <Link href="/builder" className="btn-secondary w-full block text-center">
              Generate Team
            </Link>
            <Link href="/dex" className="btn-secondary w-full block text-center">
              Browse Pokédex
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-slate-100 mb-4">
            Soul-Link Info
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>
              ⚡ <strong>Soul-Link Rules:</strong> Pairs share their fate
            </p>
            <p>
              💀 <strong>Death Propagation:</strong> If one falls, both do
            </p>
            <p>
              🎯 <strong>Constraints:</strong> Customize in Builder
            </p>
            <p>
              📖 <strong>Custom Pokémon:</strong> Add fan game variants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



