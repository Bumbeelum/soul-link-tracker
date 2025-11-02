"use client";

import { Pair } from "@/types/core";
import PokemonCard from "./PokemonCard";
import { memo } from "react";

interface PairCardProps {
  pair: Pair;
  onMarkDead?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const PairCard = memo(function PairCard({ pair, onMarkDead, onDelete, onEdit }: PairCardProps) {
  const isDead = pair.status === "Dead";

  return (
    <div className="card">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-poke-accent">
            {isDead ? "💀 Dead Pair" : "💚 Active Pair"}
          </h3>
          <div className="flex gap-2">
            {onEdit && (
              <button onClick={onEdit} className="btn-secondary text-sm">
                Edit
              </button>
            )}
            {!isDead && onMarkDead && (
              <button onClick={onMarkDead} className="btn-danger text-sm">
                Mark Dead
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="btn-secondary text-sm">
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2">
              Player 1
            </h4>
            <PokemonCard pokemon={pair.player1} isDead={isDead} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2">
              Player 2
            </h4>
            <PokemonCard pokemon={pair.player2} isDead={isDead} />
          </div>
        </div>

        <div className="text-xs text-slate-500 flex justify-between">
          <span>Created: {new Date(pair.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(pair.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
});

export default PairCard;

