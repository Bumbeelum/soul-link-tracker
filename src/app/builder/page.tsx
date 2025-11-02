"use client";

import { useAppStore } from "@/state/store";
import { useState, useMemo } from "react";
import { Pair } from "@/types/core";
import Image from "next/image";

export default function BuilderPage() {
  const pairs = useAppStore((state) => state.pairs);
  const constraints = useAppStore((state) => state.constraints);
  const setConstraints = useAppStore((state) => state.setConstraints);
  const setCurrentTeam = useAppStore((state) => state.setCurrentTeam);

  const [allCombinations, setAllCombinations] = useState<Pair[][]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [maxCombinations] = useState(50); // Limit to prevent performance issues
  const [requiredPairIds, setRequiredPairIds] = useState<Set<string>>(new Set());

  const availablePairs = useMemo(() => {
    return Object.values(pairs).filter((p) => p.status === "Alive");
  }, [pairs]);

  const generateCombinations = (
    pairs: Pair[],
    teamSize: number,
    usedSpecies: Set<string>,
    usedTypes: Set<string>,
    currentTeam: Pair[]
  ): Pair[][] => {
    // Base case: team is complete
    if (currentTeam.length === teamSize) {
      return [currentTeam];
    }

    // Stop if we have too many combinations
    if (allCombinations.length >= maxCombinations) {
      return [];
    }

    const results: Pair[][] = [];

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const p1Species = pair.player1.speciesKey;
      const p2Species = pair.player2.speciesKey;
      const p1Type = pair.player1.primaryType?.toLowerCase();
      const p2Type = pair.player2.primaryType?.toLowerCase();

      // Check species clause
      if (constraints.speciesClause) {
        if (usedSpecies.has(p1Species) || usedSpecies.has(p2Species)) {
          continue;
        }
      }

      // Check type clause
      if (constraints.primaryTypeClause) {
        if (!p1Type || !p2Type || usedTypes.has(p1Type) || usedTypes.has(p2Type)) {
          continue;
        }
      }

      // Add this pair to the team
      const newUsedSpecies = new Set(usedSpecies);
      newUsedSpecies.add(p1Species);
      newUsedSpecies.add(p2Species);

      const newUsedTypes = new Set(usedTypes);
      if (p1Type) newUsedTypes.add(p1Type);
      if (p2Type) newUsedTypes.add(p2Type);

      const newTeam = [...currentTeam, pair];

      // Use remaining pairs (after current index) to avoid duplicates
      const remainingPairs = pairs.slice(i + 1);

      // Recursively generate combinations
      const subCombinations = generateCombinations(
        remainingPairs,
        teamSize,
        newUsedSpecies,
        newUsedTypes,
        newTeam
      );

      results.push(...subCombinations);

      // Early exit if we have enough combinations
      if (results.length >= maxCombinations) {
        break;
      }
    }

    return results;
  };

  const handleGenerate = () => {
    let eligible = [...availablePairs];

    // Filter custom pokemon if not allowed
    if (!constraints.allowCustomPokemon) {
      eligible = eligible.filter(
        (p) => !p.player1.custom && !p.player2.custom
      );
    }

    const teamSize = constraints.teamSize || 6;

    // Separate required pairs from the rest
    const requiredPairs = eligible.filter(p => requiredPairIds.has(p.id));
    const optionalPairs = eligible.filter(p => !requiredPairIds.has(p.id));

    // Check if required pairs exceed team size
    if (requiredPairs.length > teamSize) {
      alert(`You've selected ${requiredPairs.length} required pairs, but team size is ${teamSize}. Please reduce required pairs or increase team size.`);
      return;
    }

    // Start with required pairs and their used species/types
    const initialUsedSpecies = new Set<string>();
    const initialUsedTypes = new Set<string>();

    for (const pair of requiredPairs) {
      initialUsedSpecies.add(pair.player1.speciesKey);
      initialUsedSpecies.add(pair.player2.speciesKey);
      if (pair.player1.primaryType) initialUsedTypes.add(pair.player1.primaryType.toLowerCase());
      if (pair.player2.primaryType) initialUsedTypes.add(pair.player2.primaryType.toLowerCase());
    }

    // Generate combinations with required pairs
    const remainingSlots = teamSize - requiredPairs.length;
    const combinations = generateCombinations(
      optionalPairs,
      remainingSlots,
      initialUsedSpecies,
      initialUsedTypes,
      []
    ).map(combo => [...requiredPairs, ...combo]);

    setAllCombinations(combinations);
    setCurrentTab(0);
  };

  const toggleRequiredPair = (pairId: string) => {
    const newRequired = new Set(requiredPairIds);
    if (newRequired.has(pairId)) {
      newRequired.delete(pairId);
    } else {
      newRequired.add(pairId);
    }
    setRequiredPairIds(newRequired);
  };

  const currentTeam = allCombinations[currentTab] || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-poke-accent mb-2">
          Combination Builder
        </h1>
        <p className="text-slate-400">
          Generate all valid team combinations based on Soul-Link constraints
        </p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          Constraints
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100">Species Clause</h3>
              <p className="text-sm text-slate-400">
                No duplicate Pokémon species in the team
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={constraints.speciesClause}
                onChange={(e) =>
                  setConstraints({ speciesClause: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-poke-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-poke-accent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100">Primary Type Clause</h3>
              <p className="text-sm text-slate-400">
                No duplicate primary types in the team
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={constraints.primaryTypeClause}
                onChange={(e) =>
                  setConstraints({ primaryTypeClause: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-poke-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-poke-accent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100">Allow Custom Pokémon</h3>
              <p className="text-sm text-slate-400">
                Include fan game and custom variants
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={constraints.allowCustomPokemon}
                onChange={(e) =>
                  setConstraints({ allowCustomPokemon: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-poke-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-poke-accent"></div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-100 mb-2">
              Team Size
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={constraints.teamSize || 6}
              onChange={(e) =>
                setConstraints({ teamSize: parseInt(e.target.value) || 6 })
              }
              className="input w-32"
            />
            <p className="text-xs text-slate-500 mt-1">
              Larger teams generate fewer combinations
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-100 mb-2">
              Version Constraint (optional)
            </label>
            <input
              type="text"
              value={constraints.versionConstraint || ""}
              onChange={(e) =>
                setConstraints({ versionConstraint: e.target.value })
              }
              className="input w-full"
              placeholder="e.g., Insurgence, Ultra Sun/Moon"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={availablePairs.length === 0}
          className="btn-primary w-full mt-8"
        >
          Generate All Combinations
        </button>

        {availablePairs.length === 0 && (
          <p className="text-center text-red-400 mt-4">
            No active pairs available. Create some pairs first!
          </p>
        )}
      </div>

      {/* Required Pairs Selection */}
      {availablePairs.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Required Pairs ({requiredPairIds.size})
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Select pairs that MUST be in every combination
              </p>
            </div>
            {requiredPairIds.size > 0 && (
              <button
                onClick={() => setRequiredPairIds(new Set())}
                className="btn-secondary text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {availablePairs.map((pair) => {
              const isRequired = requiredPairIds.has(pair.id);
              return (
                <button
                  key={pair.id}
                  onClick={() => toggleRequiredPair(pair.id)}
                  className={`text-left p-3 rounded-lg transition-all border-2 ${
                    isRequired
                      ? "bg-poke-accent/20 border-poke-accent"
                      : "bg-poke-dark border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isRequired
                        ? "bg-poke-accent border-poke-accent"
                        : "border-slate-600"
                    }`}>
                      {isRequired && <span className="text-poke-dark font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-100 truncate">
                        {pair.player1.name} × {pair.player2.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {pair.player1.primaryType} / {pair.player2.primaryType}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allCombinations.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-100">
              Found {allCombinations.length} Valid Combination{allCombinations.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setCurrentTeam(currentTeam);
                  alert('Team set! Go to Battle Helper to use it.');
                }}
                className="btn-primary"
              >
                Set as Current Team
              </button>
              <button onClick={handleGenerate} className="btn-secondary">
                Regenerate
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
                disabled={currentTab === 0}
                className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <div className="flex-1 text-center">
                <span className="text-lg font-semibold text-slate-100">
                  Combination {currentTab + 1} of {allCombinations.length}
                </span>
              </div>

              <button
                onClick={() => setCurrentTab(Math.min(allCombinations.length - 1, currentTab + 1))}
                disabled={currentTab === allCombinations.length - 1}
                className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Quick jump tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allCombinations.slice(0, 10).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTab(idx)}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
                    currentTab === idx
                      ? "bg-poke-accent text-poke-dark font-bold"
                      : "bg-poke-dark hover:bg-poke-hover"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              {allCombinations.length > 10 && (
                <span className="px-3 py-1 text-slate-500">
                  ... {allCombinations.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Team Display */}
          <CompactTeamView team={currentTeam} />
        </div>
      )}

      {allCombinations.length === 0 && availablePairs.length > 0 && (
        <div className="card text-center py-12">
          <p className="text-slate-400">
            Click "Generate All Combinations" to find all valid teams
          </p>
        </div>
      )}
    </div>
  );
}

function CompactTeamView({ team }: { team: Pair[] }) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {team.map((pair) => (
        <div key={pair.id} className="card p-4">
          <div className="space-y-3">
            {/* Pokemon 1 */}
            <div className="bg-poke-dark rounded-lg p-3">
              <div className="flex items-center gap-3">
                {pair.player1.spriteUrl ? (
                  <Image
                    src={pair.player1.spriteUrl}
                    alt={pair.player1.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-poke-card rounded flex items-center justify-center text-2xl">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-100 truncate">
                    {pair.player1.name}
                  </div>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {pair.player1.primaryType && (
                      <span
                        className={`${
                          typeColors[pair.player1.primaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pair.player1.primaryType}
                      </span>
                    )}
                    {pair.player1.secondaryType && (
                      <span
                        className={`${
                          typeColors[pair.player1.secondaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pair.player1.secondaryType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <span className="text-poke-accent font-bold">×</span>
            </div>

            {/* Pokemon 2 */}
            <div className="bg-poke-dark rounded-lg p-3">
              <div className="flex items-center gap-3">
                {pair.player2.spriteUrl ? (
                  <Image
                    src={pair.player2.spriteUrl}
                    alt={pair.player2.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-poke-card rounded flex items-center justify-center text-2xl">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-100 truncate">
                    {pair.player2.name}
                  </div>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {pair.player2.primaryType && (
                      <span
                        className={`${
                          typeColors[pair.player2.primaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pair.player2.primaryType}
                      </span>
                    )}
                    {pair.player2.secondaryType && (
                      <span
                        className={`${
                          typeColors[pair.player2.secondaryType.toLowerCase()] || "bg-gray-500"
                        } px-2 py-0.5 rounded text-white text-xs capitalize`}
                      >
                        {pair.player2.secondaryType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
