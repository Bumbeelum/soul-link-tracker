"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  getPokemonByName, 
  PokeApiPokemon, 
  getAllPokemonNames,
  getEvolutionChain,
  EvolutionChain,
  getAbilityDetails,
  PokeApiAbility,
  getMoveDetailsByName,
  PokeApiMove
} from "@/services/pokeapi";
import Image from "next/image";

export default function DexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pokemon, setPokemon] = useState<PokeApiPokemon | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [allPokemon, setAllPokemon] = useState<Array<{ name: string; url: string }>>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<string>("all");
  const [selectedAbility, setSelectedAbility] = useState<PokeApiAbility | null>(null);
  const [selectedMove, setSelectedMove] = useState<PokeApiMove | null>(null);
  const [loadingAbility, setLoadingAbility] = useState(false);
  const [loadingMove, setLoadingMove] = useState(false);

  // Load all Pokemon names for autocomplete
  useEffect(() => {
    getAllPokemonNames().then(setAllPokemon).catch(() => {});
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowAutocomplete(false);
    if (showAutocomplete) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAutocomplete]);

  const autocompleteResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allPokemon
      .filter(p => p.name.includes(query))
      .slice(0, 10);
  }, [searchQuery, allPokemon]);

  const handleSearch = async (pokemonName?: string) => {
    const nameToSearch = pokemonName || searchQuery;
    if (!nameToSearch.trim()) return;

    setLoading(true);
    setError("");
    setPokemon(null);
    setEvolutionChain(null);
    setShowAutocomplete(false);

    try {
      const data = await getPokemonByName(nameToSearch.trim());
      setPokemon(data);
      
      // Load evolution chain
      const chain = await getEvolutionChain(data.id);
      setEvolutionChain(chain);
    } catch (err) {
      setError("Pokémon not found. Check the search guide below for help.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutocompleteSelect = (name: string) => {
    setSearchQuery(name);
    handleSearch(name);
  };

  const flattenEvolutionChain = (chain: EvolutionChain | null): string[] => {
    if (!chain) return [];
    const result = [chain.species.name];
    chain.evolves_to.forEach(evo => {
      result.push(...flattenEvolutionChain(evo));
    });
    return result;
  };

  const evolutionLine = useMemo(() => {
    return flattenEvolutionChain(evolutionChain);
  }, [evolutionChain]);

  // Get color for stat value
  const getStatColor = (value: number): string => {
    if (value >= 150) return "bg-green-500";
    if (value >= 120) return "bg-green-400";
    if (value >= 100) return "bg-lime-400";
    if (value >= 80) return "bg-yellow-400";
    if (value >= 60) return "bg-orange-400";
    if (value >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatTextColor = (value: number): string => {
    if (value >= 150) return "text-green-400";
    if (value >= 120) return "text-green-300";
    if (value >= 100) return "text-lime-400";
    if (value >= 80) return "text-yellow-400";
    if (value >= 60) return "text-orange-400";
    if (value >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const handleAbilityClick = async (abilityName: string) => {
    setLoadingAbility(true);
    try {
      const details = await getAbilityDetails(abilityName);
      setSelectedAbility(details);
    } catch (error) {
      alert("Failed to load ability details");
    } finally {
      setLoadingAbility(false);
    }
  };

  const handleMoveClick = async (moveName: string) => {
    setLoadingMove(true);
    try {
      const details = await getMoveDetailsByName(moveName);
      setSelectedMove(details);
    } catch (error) {
      alert("Failed to load move details");
    } finally {
      setLoadingMove(false);
    }
  };

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

  // Generation mapping
  const generationMap: Record<string, string[]> = {
    "gen-i": ["red-blue", "yellow"],
    "gen-ii": ["gold-silver", "crystal"],
    "gen-iii": ["ruby-sapphire", "emerald", "firered-leafgreen"],
    "gen-iv": ["diamond-pearl", "platinum", "heartgold-soulsilver"],
    "gen-v": ["black-white", "black-2-white-2"],
    "gen-vi": ["x-y", "omega-ruby-alpha-sapphire"],
    "gen-vii": ["sun-moon", "ultra-sun-ultra-moon"],
    "gen-viii": ["sword-shield", "brilliant-diamond-shining-pearl", "legends-arceus"],
    "gen-ix": ["scarlet-violet"],
  };

  // Group and sort moves by level
  const movesByLevel = useMemo(() => {
    if (!pokemon) return [];
    
    const movesWithLevel = pokemon.moves.map(m => {
      let levelUpMoves = m.version_group_details.filter(
        v => v.move_learn_method.name === "level-up"
      );

      // Filter by generation if selected
      if (selectedGeneration !== "all") {
        const genVersions = generationMap[selectedGeneration] || [];
        levelUpMoves = levelUpMoves.filter(v => 
          genVersions.some(gv => v.version_group.name.includes(gv))
        );
      }
      
      const lowestLevel = levelUpMoves.length > 0
        ? Math.min(...levelUpMoves.map(v => v.level_learned_at))
        : 999;
      
      return {
        name: m.move.name,
        level: lowestLevel,
        url: m.move.url
      };
    });

    return movesWithLevel
      .filter(m => m.level !== 999)
      .sort((a, b) => a.level - b.level);
  }, [pokemon, selectedGeneration]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-poke-accent mb-2">Pokédex</h1>
        <p className="text-slate-400">
          Search Pokémon data, stats, types, abilities, moves, and evolution chains
        </p>
      </div>

      <div className="card">
        <div className="space-y-4">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAutocomplete(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Enter Pokémon name or ID (e.g., pikachu, 25, pikachu-alola)"
              className="input w-full"
              onFocus={() => setShowAutocomplete(true)}
            />
            
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-poke-card border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {autocompleteResults.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handleAutocompleteSelect(p.name)}
                    className="w-full px-4 py-2 text-left hover:bg-poke-hover transition-colors capitalize"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleSearch()} 
              disabled={loading} 
              className="btn-primary flex-1"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button 
              onClick={() => setShowGuide(!showGuide)} 
              className="btn-secondary"
            >
              {showGuide ? "Hide Guide" : "Search Guide"}
            </button>
          </div>
        </div>

        {showGuide && (
          <div className="mt-6 p-4 bg-poke-dark/60 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold text-poke-accent mb-3">Search Guide</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p><strong>Basic:</strong> pikachu, charizard, garchomp</p>
              <p><strong>By ID:</strong> 25 (Pikachu), 6 (Charizard)</p>
              <p><strong>Regional Forms:</strong></p>
              <ul className="ml-6 space-y-1">
                <li>• Alolan: <code className="bg-poke-card px-2 py-0.5 rounded">raichu-alola</code></li>
                <li>• Galarian: <code className="bg-poke-card px-2 py-0.5 rounded">ponyta-galar</code></li>
                <li>• Hisuian: <code className="bg-poke-card px-2 py-0.5 rounded">zorua-hisui</code></li>
                <li>• Paldean: <code className="bg-poke-card px-2 py-0.5 rounded">tauros-paldea-combat</code></li>
              </ul>
              <p><strong>Forms:</strong></p>
              <ul className="ml-6 space-y-1">
                <li>• Mega: <code className="bg-poke-card px-2 py-0.5 rounded">charizard-mega-x</code></li>
                <li>• Gigantamax: <code className="bg-poke-card px-2 py-0.5 rounded">pikachu-gmax</code></li>
                <li>• Gender: <code className="bg-poke-card px-2 py-0.5 rounded">pikachu-female</code></li>
              </ul>
              <p className="text-slate-400 italic mt-3">
                Tip: Use autocomplete by typing at least 2 characters!
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="card bg-red-900 bg-opacity-30 border-red-700">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {pokemon && (
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0">
                {pokemon.sprites.other?.["official-artwork"]?.front_default ? (
                  <Image
                    src={
                      pokemon.sprites.other["official-artwork"].front_default
                    }
                    alt={pokemon.name}
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-poke-dark rounded-lg flex items-center justify-center">
                    <span className="text-6xl">?</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="text-sm text-slate-500 mb-1">
                  #{pokemon.id.toString().padStart(3, "0")}
                </div>
                <h2 className="text-4xl font-bold text-slate-100 capitalize mb-4">
                  {pokemon.name.replace("-", " ")}
                </h2>

                <div className="flex gap-2 justify-center md:justify-start mb-4">
                  {pokemon.types.map((t) => (
                    <span
                      key={t.type.name}
                      className={`${
                        typeColors[t.type.name] || "bg-gray-500"
                      } px-4 py-2 rounded-full text-white font-semibold capitalize`}
                    >
                      {t.type.name}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-slate-400">
                  Height: {pokemon.height / 10}m | Weight: {pokemon.weight / 10}kg
                </div>
              </div>
            </div>
          </div>

          {/* Evolution Chain */}
          {evolutionLine.length > 1 && (
            <div className="card">
              <h3 className="text-2xl font-bold text-slate-100 mb-4">
                Evolution Chain
              </h3>
              <div className="flex flex-wrap gap-3">
                {evolutionLine.map((name, idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <button
                      onClick={() => handleSearch(name)}
                      className={`px-4 py-2 rounded-lg capitalize transition-all ${
                        name === pokemon.name
                          ? "bg-poke-accent text-poke-dark font-bold"
                          : "bg-poke-dark hover:bg-poke-hover border border-slate-700"
                      }`}
                    >
                      {name}
                    </button>
                    {idx < evolutionLine.length - 1 && (
                      <span className="text-2xl text-slate-500">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="card">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">
              Base Stats
            </h3>
            <div className="space-y-3">
              {pokemon.stats.map((s) => {
                const percentage = (s.base_stat / 255) * 100;
                const barColor = getStatColor(s.base_stat);
                const textColor = getStatTextColor(s.base_stat);
                return (
                  <div key={s.stat.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 capitalize">
                        {s.stat.name.replace("-", " ")}
                      </span>
                      <span className={`${textColor} font-bold`}>
                        {s.base_stat}
                      </span>
                    </div>
                    <div className="w-full bg-poke-dark rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-bold">Total</span>
                  <span className={`${getStatTextColor(pokemon.stats.reduce((acc, s) => acc + s.base_stat, 0) / 6)} font-bold`}>
                    {pokemon.stats.reduce((acc, s) => acc + s.base_stat, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="card">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">
              Abilities
            </h3>
            <div className="flex flex-wrap gap-3">
              {pokemon.abilities.map((a) => (
                <button
                  key={a.ability.name}
                  onClick={() => handleAbilityClick(a.ability.name)}
                  disabled={loadingAbility}
                  className={`px-4 py-2 rounded-lg transition-all hover:scale-105 ${
                    a.is_hidden
                      ? "bg-purple-900 border border-purple-700 hover:bg-purple-800"
                      : "bg-poke-dark border border-slate-700 hover:border-poke-accent"
                  } ${loadingAbility ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="capitalize">
                    {a.ability.name.replace("-", " ")}
                  </span>
                  {a.is_hidden && (
                    <span className="ml-2 text-xs text-purple-400">
                      (Hidden)
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Click any ability to see its description
            </p>
          </div>

          {/* Moves by Level */}
          {movesByLevel.length > 0 && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-slate-100">
                  Moves by Level ({movesByLevel.length})
                </h3>
                <select
                  value={selectedGeneration}
                  onChange={(e) => setSelectedGeneration(e.target.value)}
                  className="input py-1 text-sm"
                >
                  <option value="all">All Generations</option>
                  <option value="gen-i">Gen I (Red/Blue/Yellow)</option>
                  <option value="gen-ii">Gen II (Gold/Silver/Crystal)</option>
                  <option value="gen-iii">Gen III (Ruby/Sapphire/Emerald)</option>
                  <option value="gen-iv">Gen IV (Diamond/Pearl/Platinum)</option>
                  <option value="gen-v">Gen V (Black/White)</option>
                  <option value="gen-vi">Gen VI (X/Y)</option>
                  <option value="gen-vii">Gen VII (Sun/Moon)</option>
                  <option value="gen-viii">Gen VIII (Sword/Shield)</option>
                  <option value="gen-ix">Gen IX (Scarlet/Violet)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {movesByLevel.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => handleMoveClick(m.name)}
                    disabled={loadingMove}
                    className={`bg-poke-dark px-4 py-2 rounded flex justify-between items-center transition-all hover:bg-poke-hover ${
                      loadingMove ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <span className="text-slate-300 capitalize">
                      {m.name.replace("-", " ")}
                    </span>
                    <span className="text-poke-accent font-bold">
                      Lv. {m.level}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Click any move to see its details
              </p>
            </div>
          )}

          {/* All Other Moves */}
          <div className="card">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">
              All Moves ({pokemon.moves.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {pokemon.moves.map((m) => (
                <button
                  key={m.move.name}
                  onClick={() => handleMoveClick(m.move.name)}
                  disabled={loadingMove}
                  className={`bg-poke-dark px-3 py-2 rounded text-sm capitalize text-slate-300 transition-all hover:bg-poke-hover ${
                    loadingMove ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {m.move.name.replace("-", " ")}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Click any move to see its details
            </p>
          </div>
        </div>
      )}

      {!pokemon && !loading && !error && (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">
            Search for a Pokémon to view its data
          </p>
          <button 
            onClick={() => setShowGuide(true)} 
            className="btn-secondary"
          >
            View Search Guide
          </button>
        </div>
      )}

      {/* Ability Modal */}
      {selectedAbility && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAbility(null)}
        >
          <div 
            className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-poke-accent capitalize">
                {selectedAbility.name.replace("-", " ")}
              </h2>
              <button
                onClick={() => setSelectedAbility(null)}
                className="text-slate-400 hover:text-slate-100 text-2xl"
              >
                ×
              </button>
            </div>
            
            {selectedAbility.effect_entries.find(e => e.language.name === "en") && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Effect</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedAbility.effect_entries.find(e => e.language.name === "en")?.effect}
                  </p>
                </div>
                
                {selectedAbility.effect_entries.find(e => e.language.name === "en")?.short_effect && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">In Battle</h3>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedAbility.effect_entries.find(e => e.language.name === "en")?.short_effect}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedAbility.flavor_text_entries.find(e => e.language.name === "en") && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-400 italic">
                  {selectedAbility.flavor_text_entries.find(e => e.language.name === "en")?.flavor_text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move Modal */}
      {selectedMove && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMove(null)}
        >
          <div 
            className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-poke-accent capitalize">
                {selectedMove.name.replace("-", " ")}
              </h2>
              <button
                onClick={() => setSelectedMove(null)}
                className="text-slate-400 hover:text-slate-100 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-slate-400 text-sm">Type</span>
                <div className={`${typeColors[selectedMove.type.name] || "bg-gray-500"} px-3 py-1 rounded-lg text-white font-semibold capitalize mt-1`}>
                  {selectedMove.type.name}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Category</span>
                <p className="text-slate-100 font-bold capitalize">{selectedMove.damage_class.name}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Power</span>
                <p className="text-slate-100 font-bold">{selectedMove.power || "—"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Accuracy</span>
                <p className="text-slate-100 font-bold">{selectedMove.accuracy ? `${selectedMove.accuracy}%` : "—"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-sm">PP</span>
                <p className="text-slate-100 font-bold">{selectedMove.pp}</p>
              </div>
            </div>

            {selectedMove.effect_entries.find(e => e.language.name === "en") && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Effect</h3>
                <p className="text-slate-300 leading-relaxed">
                  {selectedMove.effect_entries.find(e => e.language.name === "en")?.effect}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
