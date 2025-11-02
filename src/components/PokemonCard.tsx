"use client";

import { PokemonBase } from "@/types/core";
import Image from "next/image";
import { memo } from "react";

interface PokemonCardProps {
  pokemon: PokemonBase;
  isDead?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Move outside component to prevent recreation on every render
const typeColors: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-700",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-800",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-600",
  dark: "bg-gray-700",
  steel: "bg-gray-500",
  fairy: "bg-pink-300",
};

const PokemonCard = memo(function PokemonCard({
  pokemon,
  isDead = false,
  showActions = false,
  onEdit,
  onDelete,
}: PokemonCardProps) {

  return (
    <div
      className={`card relative ${
        isDead ? "opacity-50 grayscale" : ""
      } transition-all`}
    >
      {isDead && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-20 rounded-xl flex items-center justify-center">
          <span className="text-6xl text-red-500 font-bold">✕</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {pokemon.spriteUrl ? (
          <Image
            src={pokemon.spriteUrl}
            alt={pokemon.name}
            width={96}
            height={96}
            className="object-contain"
          />
        ) : (
          <div className="w-24 h-24 bg-poke-dark rounded-lg flex items-center justify-center">
            <span className="text-4xl">?</span>
          </div>
        )}

        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-100">{pokemon.name}</h3>
          {pokemon.custom && (
            <span className="text-xs bg-purple-600 px-2 py-1 rounded-full text-white">
              Custom
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {pokemon.primaryType && (
            <span
              className={`${
                typeColors[pokemon.primaryType.toLowerCase()] || "bg-gray-500"
              } px-3 py-1 rounded-full text-white text-sm font-semibold capitalize`}
            >
              {pokemon.primaryType}
            </span>
          )}
          {pokemon.secondaryType && (
            <span
              className={`${
                typeColors[pokemon.secondaryType.toLowerCase()] || "bg-gray-500"
              } px-3 py-1 rounded-full text-white text-sm font-semibold capitalize`}
            >
              {pokemon.secondaryType}
            </span>
          )}
        </div>

        {pokemon.notes && (
          <p className="text-sm text-slate-400 text-center">{pokemon.notes}</p>
        )}

        {showActions && (
          <div className="flex gap-2 mt-2">
            {onEdit && (
              <button onClick={onEdit} className="btn-secondary text-sm">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="btn-danger text-sm">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PokemonCard;
