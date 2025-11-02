"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PokemonBase, Pair, SoulLinkConstraints, UUID } from "@/types/core";
import { generateUUID } from "@/lib/utils";

interface PokemonSlice {
  pokemon: Record<UUID, PokemonBase>;
  addPokemon: (p: PokemonBase) => void;
  updatePokemon: (id: UUID, patch: Partial<PokemonBase>) => void;
  deletePokemon: (id: UUID) => void;
  getPokemonById: (id: UUID) => PokemonBase | undefined;
}

interface PairSlice {
  pairs: Record<UUID, Pair>;
  addPair: (pair: Pair) => void;
  updatePair: (id: UUID, patch: Partial<Pair>) => void;
  markDead: (pairId: UUID) => void;
  deletePair: (id: UUID) => void;
  getPairById: (id: UUID) => Pair | undefined;
}

interface ConstraintsSlice {
  constraints: SoulLinkConstraints;
  setConstraints: (c: Partial<SoulLinkConstraints>) => void;
}

interface BattleSlice {
  currentTeam: Pair[];
  playerSide: 1 | 2;
  setCurrentTeam: (team: Pair[]) => void;
  setPlayerSide: (side: 1 | 2) => void;
}

type AppState = PokemonSlice & PairSlice & ConstraintsSlice & BattleSlice;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Pokemon state
      pokemon: {},
      addPokemon: (p) =>
        set((state) => ({
          pokemon: { ...state.pokemon, [p.id]: p },
        })),
      updatePokemon: (id, patch) =>
        set((state) => {
          const existing = state.pokemon[id];
          if (!existing) return state;
          return {
            pokemon: {
              ...state.pokemon,
              [id]: { ...existing, ...patch },
            },
          };
        }),
      deletePokemon: (id) =>
        set((state) => {
          const newPokemon = { ...state.pokemon };
          delete newPokemon[id];
          return { pokemon: newPokemon };
        }),
      getPokemonById: (id) => get().pokemon[id],

      // Pair state
      pairs: {},
      addPair: (pair) =>
        set((state) => ({
          pairs: { ...state.pairs, [pair.id]: pair },
        })),
      updatePair: (id, patch) =>
        set((state) => {
          const existing = state.pairs[id];
          if (!existing) return state;
          return {
            pairs: {
              ...state.pairs,
              [id]: {
                ...existing,
                ...patch,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      markDead: (pairId) =>
        set((state) => {
          const pair = state.pairs[pairId];
          if (!pair) return state;
          return {
            pairs: {
              ...state.pairs,
              [pairId]: {
                ...pair,
                status: "Dead",
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      deletePair: (id) =>
        set((state) => {
          const newPairs = { ...state.pairs };
          delete newPairs[id];
          return { pairs: newPairs };
        }),
      getPairById: (id) => get().pairs[id],

      // Constraints state
      constraints: {
        speciesClause: true,
        primaryTypeClause: true,
        allowCustomPokemon: true,
        versionConstraint: "Any",
        teamSize: 6,
      },
      setConstraints: (c) =>
        set((state) => ({
          constraints: { ...state.constraints, ...c },
        })),

      // Battle state
      currentTeam: [],
      playerSide: 1,
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setPlayerSide: (side) => set({ playerSide: side }),
    }),
    {
      name: "soul-link-tracker",
    }
  )
);

