export type UUID = string;

export type LifeStatus = "Alive" | "Dead";

export interface PokemonBase {
  id: UUID;
  name: string;
  speciesKey: string;
  primaryType?: string;
  secondaryType?: string | null;
  spriteUrl?: string | null;
  custom: boolean;
  notes?: string;
}

export interface Pair {
  id: UUID;
  player1: PokemonBase;
  player2: PokemonBase;
  status: LifeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SoulLinkConstraints {
  speciesClause: boolean;
  primaryTypeClause: boolean;
  allowCustomPokemon: boolean;
  versionConstraint?: string;
  teamSize?: number;
}

export interface AppData {
  pokemon: Record<UUID, PokemonBase>;
  pairs: Record<UUID, Pair>;
  constraints: SoulLinkConstraints;
}


