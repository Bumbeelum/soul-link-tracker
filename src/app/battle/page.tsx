"use client";

import { useAppStore } from "@/state/store";
import { useState, useMemo } from "react";
import { PokemonBase } from "@/types/core";
import Image from "next/image";
import Link from "next/link";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import { getPokemonByName, PokeApiPokemon } from "@/services/pokeapi";

// Type effectiveness chart
const TYPE_EFFECTIVENESS: Record<string, { weakTo: string[]; resistantTo: string[]; immuneTo: string[] }> = {
  normal: { weakTo: ['fighting'], resistantTo: [], immuneTo: ['ghost'] },
  fire: { weakTo: ['water', 'ground', 'rock'], resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immuneTo: [] },
  water: { weakTo: ['electric', 'grass'], resistantTo: ['fire', 'water', 'ice', 'steel'], immuneTo: [] },
  electric: { weakTo: ['ground'], resistantTo: ['electric', 'flying', 'steel'], immuneTo: [] },
  grass: { weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'], resistantTo: ['water', 'electric', 'grass', 'ground'], immuneTo: [] },
  ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], resistantTo: ['ice'], immuneTo: [] },
  fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistantTo: ['bug', 'rock', 'dark'], immuneTo: [] },
  poison: { weakTo: ['ground', 'psychic'], resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immuneTo: [] },
  ground: { weakTo: ['water', 'grass', 'ice'], resistantTo: ['poison', 'rock'], immuneTo: ['electric'] },
  flying: { weakTo: ['electric', 'ice', 'rock'], resistantTo: ['grass', 'fighting', 'bug'], immuneTo: ['ground'] },
  psychic: { weakTo: ['bug', 'ghost', 'dark'], resistantTo: ['fighting', 'psychic'], immuneTo: [] },
  bug: { weakTo: ['fire', 'flying', 'rock'], resistantTo: ['grass', 'fighting', 'ground'], immuneTo: [] },
  rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], resistantTo: ['normal', 'fire', 'poison', 'flying'], immuneTo: [] },
  ghost: { weakTo: ['ghost', 'dark'], resistantTo: ['poison', 'bug'], immuneTo: ['normal', 'fighting'] },
  dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistantTo: ['fire', 'water', 'electric', 'grass'], immuneTo: [] },
  dark: { weakTo: ['fighting', 'bug', 'fairy'], resistantTo: ['ghost', 'dark'], immuneTo: ['psychic'] },
  steel: { weakTo: ['fire', 'fighting', 'ground'], resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immuneTo: ['poison'] },
  fairy: { weakTo: ['poison', 'steel'], resistantTo: ['fighting', 'bug', 'dark'], immuneTo: ['dragon'] },
};

// Generation mapping for movesets
const generationMap: Record<string, string[]> = {
  "Gen 1": ["red-blue", "yellow"],
  "Gen 2": ["gold-silver", "crystal"],
  "Gen 3": ["ruby-sapphire", "emerald", "firered-leafgreen"],
  "Gen 4": ["diamond-pearl", "platinum", "heartgold-soulsilver"],
  "Gen 5": ["black-white", "black-2-white-2"],
  "Gen 6": ["x-y", "omega-ruby-alpha-sapphire"],
  "Gen 7": ["sun-moon", "ultra-sun-ultra-moon"],
  "Gen 8": ["sword-shield"],
  "Gen 9": ["scarlet-violet"],
};

export default function BattlePage() {
  const currentTeam = useAppStore((state) => state.currentTeam);
  const playerSide = useAppStore((state) => state.playerSide);
  const setPlayerSide = useAppStore((state) => state.setPlayerSide);

  const [selectedPokemon, setSelectedPokemon] = useState<PokemonBase | null>(null);
  const [opponentType, setOpponentType] = useState<string>("");
  
  // New states for opponent selection
  const [opponentName, setOpponentName] = useState<string>("");
  const [opponentData, setOpponentData] = useState<PokeApiPokemon | null>(null);
  const [loadingOpponent, setLoadingOpponent] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<string>("Gen 9");

  const myPokemon = useMemo(() => {
    return currentTeam.map(pair => playerSide === 1 ? pair.player1 : pair.player2);
  }, [currentTeam, playerSide]);

  const handleOpponentSearch = async () => {
    if (!opponentName.trim()) return;
    
    setLoadingOpponent(true);
    try {
      const data = await getPokemonByName(opponentName);
      setOpponentData(data);
    } catch (error) {
      alert("Pokémon not found! Try searching for exact names or regional forms (e.g., 'pikachu', 'raichu-alola')");
      setOpponentData(null);
    } finally {
      setLoadingOpponent(false);
    }
  };

  const getOpponentTypes = () => {
    if (!opponentData) return [];
    return opponentData.types.map(t => t.type.name);
  };

  const calculateMatchupDamage = (attackerTypes: string[], defenderTypes: string[]) => {
    // Calculate offensive effectiveness (attacker's moves against defender)
    let multiplier = 1;
    
    defenderTypes.forEach(defType => {
      const effectiveness = TYPE_EFFECTIVENESS[defType];
      if (!effectiveness) return;
      
      // Check if defender is weak to any of attacker's types
      attackerTypes.forEach(atkType => {
        if (effectiveness.weakTo.includes(atkType)) {
          multiplier *= 2;
        } else if (effectiveness.resistantTo.includes(atkType)) {
          multiplier *= 0.5;
        } else if (effectiveness.immuneTo.includes(atkType)) {
          multiplier = 0;
        }
      });
    });
    
    return multiplier;
  };

  const getFilteredMoves = () => {
    if (!opponentData) return [];
    
    const genVersions = generationMap[selectedGeneration] || [];
    
    const levelUpMoves = opponentData.moves
      .flatMap(moveData => 
        moveData.version_group_details
          .filter(detail => 
            detail.move_learn_method.name === "level-up" &&
            genVersions.includes(detail.version_group.name)
          )
          .map(detail => ({
            name: moveData.move.name,
            level: detail.level_learned_at,
            url: moveData.move.url,
          }))
      )
      .sort((a, b) => a.level - b.level);

    // Remove duplicates (keep earliest level)
    const uniqueMoves = levelUpMoves.reduce((acc, move) => {
      if (!acc.find(m => m.name === move.name)) {
        acc.push(move);
      }
      return acc;
    }, [] as typeof levelUpMoves);

    return uniqueMoves;
  };

  const getTypeEffectiveness = (pokemon: PokemonBase) => {
    const types = [pokemon.primaryType?.toLowerCase(), pokemon.secondaryType?.toLowerCase()].filter(Boolean) as string[];
    
    const weaknesses = new Set<string>();
    const resistances = new Set<string>();
    const immunities = new Set<string>();

    types.forEach(type => {
      const effectiveness = TYPE_EFFECTIVENESS[type];
      if (effectiveness) {
        effectiveness.weakTo.forEach(t => weaknesses.add(t));
        effectiveness.resistantTo.forEach(t => resistances.add(t));
        effectiveness.immuneTo.forEach(t => immunities.add(t));
      }
    });

    // Remove overlaps (immunity > resistance > weakness)
    resistances.forEach(r => weaknesses.delete(r));
    immunities.forEach(i => {
      weaknesses.delete(i);
      resistances.delete(i);
    });

    // Check for double weaknesses/resistances
    const doubleWeaknesses = new Set<string>();
    const doubleResistances = new Set<string>();

    if (types.length === 2) {
      const [type1, type2] = types;
      const eff1 = TYPE_EFFECTIVENESS[type1];
      const eff2 = TYPE_EFFECTIVENESS[type2];

      if (eff1 && eff2) {
        eff1.weakTo.forEach(t => {
          if (eff2.weakTo.includes(t)) {
            doubleWeaknesses.add(t);
          }
        });

        eff1.resistantTo.forEach(t => {
          if (eff2.resistantTo.includes(t)) {
            doubleResistances.add(t);
          }
        });
      }
    }

    return { weaknesses: Array.from(weaknesses), resistances: Array.from(resistances), immunities: Array.from(immunities), doubleWeaknesses: Array.from(doubleWeaknesses), doubleResistances: Array.from(doubleResistances) };
  };

  const getMatchupAgainstType = (pokemon: PokemonBase, opponentType: string) => {
    const effectiveness = getTypeEffectiveness(pokemon);
    if (effectiveness.immunities.includes(opponentType.toLowerCase())) return { rating: 'immune', color: 'text-purple-400' };
    if (effectiveness.doubleResistances.includes(opponentType.toLowerCase())) return { rating: 'double resist', color: 'text-green-500' };
    if (effectiveness.resistances.includes(opponentType.toLowerCase())) return { rating: 'resists', color: 'text-green-400' };
    if (effectiveness.doubleWeaknesses.includes(opponentType.toLowerCase())) return { rating: '4x weak', color: 'text-red-500' };
    if (effectiveness.weaknesses.includes(opponentType.toLowerCase())) return { rating: 'weak', color: 'text-orange-400' };
    return { rating: 'neutral', color: 'text-slate-400' };
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-poke-accent mb-2">
          Battle Helper
        </h1>
        <p className="text-slate-400">
          Type matchups, weaknesses, and battle recommendations
        </p>
      </div>

      {currentTeam.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">
            No team selected. Generate a team in the Builder first!
          </p>
          <Link href="/builder" className="btn-primary">
            Go to Builder
          </Link>
        </div>
      ) : (
        <>
          {/* Player Selection */}
          <div className="card">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Select Your Side
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPlayerSide(1)}
                className={playerSide === 1 ? "btn-primary" : "btn-secondary"}
              >
                Player 1
              </button>
              <button
                onClick={() => setPlayerSide(2)}
                className={playerSide === 2 ? "btn-primary" : "btn-secondary"}
              >
                Player 2
              </button>
            </div>
          </div>

          {/* Team Overview */}
          <div className="card">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Your Team (Player {playerSide})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {myPokemon.map((pokemon, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPokemon(pokemon)}
                  className={`card p-3 transition-all ${
                    selectedPokemon?.id === pokemon.id
                      ? "ring-2 ring-poke-accent"
                      : "hover:bg-poke-hover"
                  }`}
                >
                  {pokemon.spriteUrl ? (
                    <Image
                      src={pokemon.spriteUrl}
                      alt={pokemon.name}
                      width={64}
                      height={64}
                      className="w-full object-contain"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-poke-dark rounded flex items-center justify-center text-2xl">
                      ?
                    </div>
                  )}
                  <div className="text-sm font-semibold text-slate-100 mt-2 text-center truncate">
                    {pokemon.name}
                  </div>
                  <div className="flex gap-1 justify-center mt-1 flex-wrap">
                    {pokemon.primaryType && (
                      <span
                        className={`${
                          typeColors[pokemon.primaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pokemon.primaryType}
                      </span>
                    )}
                    {pokemon.secondaryType && (
                      <span
                        className={`${
                          typeColors[pokemon.secondaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pokemon.secondaryType}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Opponent Pokemon Selection */}
          <div className="card">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Select Opponent Pokémon
            </h2>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Opponent Pokémon Name
                </label>
                <PokemonAutocomplete
                  value={opponentName}
                  onChange={setOpponentName}
                  placeholder="e.g., Garchomp, Raichu-Alola"
                />
              </div>
              <button
                onClick={handleOpponentSearch}
                disabled={loadingOpponent || !opponentName}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingOpponent ? "Loading..." : "Load Opponent"}
              </button>
            </div>

            {opponentData && (
              <div className="mt-6 bg-poke-dark p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  {opponentData.sprites.front_default && (
                    <Image
                      src={opponentData.sprites.front_default}
                      alt={opponentData.name}
                      width={96}
                      height={96}
                      className="object-contain"
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 capitalize">
                      {opponentData.name.replace("-", " ")}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      {opponentData.types.map(t => (
                        <span
                          key={t.type.name}
                          className={`${typeColors[t.type.name]} px-3 py-1 rounded-lg text-white font-semibold capitalize`}
                        >
                          {t.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matchup Analysis */}
          {selectedPokemon && opponentData && (
            <div className="card">
              <h2 className="text-2xl font-bold text-poke-accent mb-6">
                Matchup: {selectedPokemon.name} vs {opponentData.name.replace("-", " ")}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Your Pokemon Offense */}
                <div className="bg-poke-dark p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-blue-400 mb-3">
                    Your Offense (How effective are {selectedPokemon.name}'s moves?)
                  </h3>
                  {(() => {
                    const myTypes = [selectedPokemon.primaryType, selectedPokemon.secondaryType]
                      .filter(Boolean)
                      .map(t => t!.toLowerCase());
                    const oppTypes = getOpponentTypes();
                    const damage = calculateMatchupDamage(myTypes, oppTypes);
                    
                    let color = "text-slate-400";
                    let label = "Neutral";
                    
                    if (damage === 0) {
                      color = "text-purple-400";
                      label = "IMMUNE (0x damage)";
                    } else if (damage >= 4) {
                      color = "text-green-500";
                      label = "SUPER EFFECTIVE (4x damage)";
                    } else if (damage >= 2) {
                      color = "text-green-400";
                      label = "Super Effective (2x damage)";
                    } else if (damage <= 0.25) {
                      color = "text-red-500";
                      label = "Very Resisted (¼x damage)";
                    } else if (damage <= 0.5) {
                      color = "text-orange-400";
                      label = "Not Very Effective (½x damage)";
                    }
                    
                    return (
                      <div className={`${color} text-2xl font-bold text-center p-4`}>
                        {label}
                      </div>
                    );
                  })()}
                </div>

                {/* Your Pokemon Defense */}
                <div className="bg-poke-dark p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-red-400 mb-3">
                    Your Defense (How effective are opponent's moves?)
                  </h3>
                  {(() => {
                    const myTypes = [selectedPokemon.primaryType, selectedPokemon.secondaryType]
                      .filter(Boolean)
                      .map(t => t!.toLowerCase());
                    const oppTypes = getOpponentTypes();
                    const damage = calculateMatchupDamage(oppTypes, myTypes);
                    
                    let color = "text-slate-400";
                    let label = "Neutral";
                    
                    if (damage === 0) {
                      color = "text-green-500";
                      label = "IMMUNE (0x damage taken!)";
                    } else if (damage >= 4) {
                      color = "text-red-500";
                      label = "4x WEAK (4x damage taken!)";
                    } else if (damage >= 2) {
                      color = "text-orange-400";
                      label = "Weak (2x damage taken)";
                    } else if (damage <= 0.25) {
                      color = "text-green-500";
                      label = "Quad Resist (¼x damage taken)";
                    } else if (damage <= 0.5) {
                      color = "text-green-400";
                      label = "Resist (½x damage taken)";
                    }
                    
                    return (
                      <div className={`${color} text-2xl font-bold text-center p-4`}>
                        {label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-100">
                    Opponent's Moveset
                  </h3>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-slate-400">Generation:</label>
                    <select
                      value={selectedGeneration}
                      onChange={(e) => setSelectedGeneration(e.target.value)}
                      className="bg-poke-dark border border-slate-700 rounded px-3 py-1 text-slate-300"
                    >
                      {Object.keys(generationMap).map(gen => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {getFilteredMoves().map((move, idx) => (
                    <div
                      key={idx}
                      className="bg-poke-dark px-4 py-2 rounded flex justify-between items-center"
                    >
                      <span className="text-slate-200 capitalize">
                        {move.name.replace("-", " ")}
                      </span>
                      <span className="text-slate-400 text-sm">
                        Level {move.level}
                      </span>
                    </div>
                  ))}
                  {getFilteredMoves().length === 0 && (
                    <p className="text-slate-500 text-center py-4">
                      No moves found for {selectedGeneration}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Opponent Type Checker */}
          <div className="card">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Check Matchup Against Opponent Type
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(typeColors).map(type => (
                <button
                  key={type}
                  onClick={() => setOpponentType(type)}
                  className={`${
                    typeColors[type]
                  } px-4 py-2 rounded-lg text-white font-semibold capitalize transition-all ${
                    opponentType === type ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {opponentType && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">
                  Best Matchups Against {opponentType.charAt(0).toUpperCase() + opponentType.slice(1)}
                </h3>
                <div className="space-y-2">
                  {myPokemon.map((pokemon, idx) => {
                    const matchup = getMatchupAgainstType(pokemon, opponentType);
                    return (
                      <div
                        key={idx}
                        className="bg-poke-dark p-3 rounded-lg flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          {pokemon.spriteUrl && (
                            <Image
                              src={pokemon.spriteUrl}
                              alt={pokemon.name}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          )}
                          <span className="font-semibold">{pokemon.name}</span>
                          <div className="flex gap-1">
                            {pokemon.primaryType && (
                              <span className={`${typeColors[pokemon.primaryType.toLowerCase()]} px-2 py-0.5 rounded text-white text-xs capitalize`}>
                                {pokemon.primaryType}
                              </span>
                            )}
                            {pokemon.secondaryType && (
                              <span className={`${typeColors[pokemon.secondaryType.toLowerCase()]} px-2 py-0.5 rounded text-white text-xs capitalize`}>
                                {pokemon.secondaryType}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`${matchup.color} font-bold`}>
                          {matchup.rating.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Pokemon Details */}
          {selectedPokemon && (
            <div className="card">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                {selectedPokemon.name} - Type Effectiveness
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    Weaknesses
                  </h3>
                  <div className="space-y-2">
                    {getTypeEffectiveness(selectedPokemon).doubleWeaknesses.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`${typeColors[type]} px-3 py-1 rounded-lg text-white font-semibold capitalize flex-1`}>
                          {type}
                        </span>
                        <span className="text-red-500 font-bold">4x WEAK</span>
                      </div>
                    ))}
                    {getTypeEffectiveness(selectedPokemon).weaknesses.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`${typeColors[type]} px-3 py-1 rounded-lg text-white font-semibold capitalize flex-1`}>
                          {type}
                        </span>
                        <span className="text-orange-400 font-bold">2x WEAK</span>
                      </div>
                    ))}
                    {getTypeEffectiveness(selectedPokemon).weaknesses.length === 0 && 
                     getTypeEffectiveness(selectedPokemon).doubleWeaknesses.length === 0 && (
                      <p className="text-slate-500">None</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-3">
                    Resistances & Immunities
                  </h3>
                  <div className="space-y-2">
                    {getTypeEffectiveness(selectedPokemon).immunities.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`${typeColors[type]} px-3 py-1 rounded-lg text-white font-semibold capitalize flex-1`}>
                          {type}
                        </span>
                        <span className="text-purple-400 font-bold">IMMUNE</span>
                      </div>
                    ))}
                    {getTypeEffectiveness(selectedPokemon).doubleResistances.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`${typeColors[type]} px-3 py-1 rounded-lg text-white font-semibold capitalize flex-1`}>
                          {type}
                        </span>
                        <span className="text-green-500 font-bold">¼x RESIST</span>
                      </div>
                    ))}
                    {getTypeEffectiveness(selectedPokemon).resistances.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <span className={`${typeColors[type]} px-3 py-1 rounded-lg text-white font-semibold capitalize flex-1`}>
                          {type}
                        </span>
                        <span className="text-green-400 font-bold">½x RESIST</span>
                      </div>
                    ))}
                    {getTypeEffectiveness(selectedPokemon).resistances.length === 0 && 
                     getTypeEffectiveness(selectedPokemon).immunities.length === 0 &&
                     getTypeEffectiveness(selectedPokemon).doubleResistances.length === 0 && (
                      <p className="text-slate-500">None</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPokemon.notes && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Notes</h3>
                  <p className="text-slate-300">{selectedPokemon.notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}



