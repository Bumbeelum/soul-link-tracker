const BASE = process.env.NEXT_PUBLIC_POKE_BASE ?? "https://pokeapi.co/api/v2";

export interface PokeApiPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: {
      name: string;
    };
  }>;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: {
        front_default?: string | null;
      };
    };
  };
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
    is_hidden: boolean;
  }>;
  moves: Array<{
    move: {
      name: string;
      url: string;
    };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: {
        name: string;
      };
      version_group: {
        name: string;
      };
    }>;
  }>;
}

export interface PokeApiMove {
  name: string;
  type: {
    name: string;
  };
  power: number | null;
  accuracy: number | null;
  pp: number;
  damage_class: {
    name: string;
  };
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
    };
  }>;
}

export async function getPokemonByName(name: string): Promise<PokeApiPokemon> {
  const res = await fetch(`${BASE}/pokemon/${encodeURIComponent(name.toLowerCase())}`);
  if (!res.ok) throw new Error("Pokémon not found");
  return res.json();
}

export async function searchPokemon(query: string): Promise<PokeApiPokemon | null> {
  try {
    return await getPokemonByName(query);
  } catch {
    return null;
  }
}

export async function getMoveDetails(moveUrl: string): Promise<PokeApiMove> {
  const res = await fetch(moveUrl);
  if (!res.ok) throw new Error("Move not found");
  return res.json();
}

export interface PokeApiAbility {
  name: string;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
    };
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
    };
  }>;
}

export async function getAbilityDetails(abilityName: string): Promise<PokeApiAbility> {
  const res = await fetch(`${BASE}/ability/${encodeURIComponent(abilityName.toLowerCase())}`);
  if (!res.ok) throw new Error("Ability not found");
  return res.json();
}

export async function getMoveDetailsByName(moveName: string): Promise<PokeApiMove> {
  const res = await fetch(`${BASE}/move/${encodeURIComponent(moveName.toLowerCase())}`);
  if (!res.ok) throw new Error("Move not found");
  return res.json();
}

export async function getPokemonList(limit = 151, offset = 0) {
  const res = await fetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Failed to fetch Pokémon list");
  const data = await res.json();
  return data.results as Array<{ name: string; url: string }>;
}

export async function getAllPokemonNames() {
  const res = await fetch(`${BASE}/pokemon?limit=10000`);
  if (!res.ok) throw new Error("Failed to fetch Pokémon list");
  const data = await res.json();
  return data.results as Array<{ name: string; url: string }>;
}

export interface EvolutionChain {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionChain[];
}

export async function getEvolutionChain(pokemonId: number): Promise<EvolutionChain | null> {
  try {
    // First get the species data
    const speciesRes = await fetch(`${BASE}/pokemon-species/${pokemonId}`);
    if (!speciesRes.ok) return null;
    const speciesData = await speciesRes.json();
    
    // Then get the evolution chain
    const evolutionRes = await fetch(speciesData.evolution_chain.url);
    if (!evolutionRes.ok) return null;
    const evolutionData = await evolutionRes.json();
    
    return evolutionData.chain;
  } catch {
    return null;
  }
}

