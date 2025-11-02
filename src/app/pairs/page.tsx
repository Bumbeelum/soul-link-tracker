"use client";

import { useAppStore } from "@/state/store";
import { useState, useMemo, useEffect, useRef } from "react";
import { generateUUID } from "@/lib/utils";
import { PokemonBase, Pair } from "@/types/core";
import PairCard from "@/components/PairCard";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import { getPokemonByName } from "@/services/pokeapi";

export default function PairsPage() {
  const pairs = useAppStore((state) => state.pairs);
  const addPair = useAppStore((state) => state.addPair);
  const markDead = useAppStore((state) => state.markDead);
  const deletePair = useAppStore((state) => state.deletePair);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPair, setEditingPair] = useState<Pair | null>(null);
  const [filter, setFilter] = useState<"all" | "alive" | "dead">("all");
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");
  
  const editFormRef = useRef<HTMLDivElement>(null);

  // Scroll to edit form when opened
  useEffect(() => {
    if (editingPair && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [editingPair]);

  const filteredPairs = useMemo(() => {
    const pairsArray = Object.values(pairs);
    if (filter === "all") return pairsArray;
    return pairsArray.filter((p) =>
      filter === "alive" ? p.status === "Alive" : p.status === "Dead"
    );
  }, [pairs, filter]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-poke-accent mb-2">
            Pair Manager
          </h1>
          <p className="text-slate-400">
            Manage your Soul-Link pairs
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPair(null);
            setShowCreateForm(!showCreateForm);
          }}
          className="btn-primary"
        >
          {showCreateForm ? "Cancel" : "+ Create Pair"}
        </button>
      </div>

      {showCreateForm && !editingPair && (
        <CreatePairForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingPair && (
        <div ref={editFormRef}>
          <EditPairForm
            pair={editingPair}
            onSuccess={() => setEditingPair(null)}
            onCancel={() => setEditingPair(null)}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-primary" : "btn-secondary"}
          >
            All ({Object.values(pairs).length})
          </button>
          <button
            onClick={() => setFilter("alive")}
            className={filter === "alive" ? "btn-primary" : "btn-secondary"}
          >
            Active ({Object.values(pairs).filter((p) => p.status === "Alive").length})
          </button>
          <button
            onClick={() => setFilter("dead")}
            className={filter === "dead" ? "btn-primary" : "btn-secondary"}
          >
            Fallen ({Object.values(pairs).filter((p) => p.status === "Dead").length})
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-slate-400">View:</span>
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === "detailed"
                ? "bg-poke-accent text-poke-dark font-semibold"
                : "bg-poke-card text-slate-300 hover:bg-poke-hover border border-slate-700"
            }`}
            title="Detailed view"
          >
            <span className="text-lg">☰</span>
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === "compact"
                ? "bg-poke-accent text-poke-dark font-semibold"
                : "bg-poke-card text-slate-300 hover:bg-poke-hover border border-slate-700"
            }`}
            title="Compact grid view"
          >
            <span className="text-lg">▦</span>
          </button>
        </div>
      </div>

      {filteredPairs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">No pairs found</p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Pair
            </button>
          )}
        </div>
      ) : viewMode === "detailed" ? (
        <div className="grid gap-6">
          {filteredPairs.map((pair) => (
            <PairCard
              key={pair.id}
              pair={pair}
              onEdit={() => {
                setShowCreateForm(false);
                setEditingPair(pair);
              }}
              onMarkDead={() => markDead(pair.id)}
              onDelete={() => {
                if (confirm("Are you sure you want to delete this pair?")) {
                  deletePair(pair.id);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.map((pair) => (
            <CompactPairCard
              key={pair.id}
              pair={pair}
              onEdit={() => {
                setShowCreateForm(false);
                setEditingPair(pair);
              }}
              onMarkDead={() => markDead(pair.id)}
              onDelete={() => {
                if (confirm("Are you sure you want to delete this pair?")) {
                  deletePair(pair.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePairForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const addPair = useAppStore((state) => state.addPair);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Player 1 state
  const [p1Name, setP1Name] = useState("");
  const [p1Custom, setP1Custom] = useState(false);
  const [p1Type1, setP1Type1] = useState("");
  const [p1Type2, setP1Type2] = useState("");
  const [p1Sprite, setP1Sprite] = useState("");

  // Player 2 state
  const [p2Name, setP2Name] = useState("");
  const [p2Custom, setP2Custom] = useState(false);
  const [p2Type1, setP2Type1] = useState("");
  const [p2Type2, setP2Type2] = useState("");
  const [p2Sprite, setP2Sprite] = useState("");

  const handleFetchPokemon = async (
    name: string,
    setType1: (v: string) => void,
    setType2: (v: string) => void,
    setSprite: (v: string) => void
  ) => {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const data = await getPokemonByName(name);
      setType1(data.types[0]?.type.name || "");
      setType2(data.types[1]?.type.name || "");
      setSprite(
        data.sprites.other?.["official-artwork"]?.front_default ||
          data.sprites.front_default ||
          ""
      );
    } catch (err) {
      setError("Pokémon not found. Enable custom mode to add manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name || !p2Name) {
      setError("Both Pokémon names are required");
      return;
    }

    const player1: PokemonBase = {
      id: generateUUID(),
      name: p1Name,
      speciesKey: p1Name.toLowerCase().replace(/\s+/g, "-"),
      primaryType: p1Type1 || undefined,
      secondaryType: p1Type2 || null,
      spriteUrl: p1Sprite || null,
      custom: p1Custom,
    };

    const player2: PokemonBase = {
      id: generateUUID(),
      name: p2Name,
      speciesKey: p2Name.toLowerCase().replace(/\s+/g, "-"),
      primaryType: p2Type1 || undefined,
      secondaryType: p2Type2 || null,
      spriteUrl: p2Sprite || null,
      custom: p2Custom,
    };

    const pair: Pair = {
      id: generateUUID(),
      player1,
      player2,
      status: "Alive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPair(pair);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">
        Create New Pair
      </h2>

      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Player 1 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-poke-accent">Player 1</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Pokémon Name
            </label>
            <div className="flex gap-2">
              {p1Custom ? (
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Delta Charizard"
                />
              ) : (
                <PokemonAutocomplete
                  value={p1Name}
                  onChange={setP1Name}
                  placeholder="e.g., Garchomp"
                  className="flex-1"
                />
              )}
              {!p1Custom && (
                <button
                  type="button"
                  onClick={() =>
                    handleFetchPokemon(p1Name, setP1Type1, setP1Type2, setP1Sprite)
                  }
                  disabled={loading}
                  className="btn-secondary"
                >
                  Fetch
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="p1Custom"
              checked={p1Custom}
              onChange={(e) => setP1Custom(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="p1Custom" className="text-sm text-slate-300">
              Custom Pokémon (not in PokéAPI)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Primary Type
            </label>
            <input
              type="text"
              value={p1Type1}
              onChange={(e) => setP1Type1(e.target.value)}
              className="input w-full"
              placeholder="e.g., Dragon"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Secondary Type (optional)
            </label>
            <input
              type="text"
              value={p1Type2}
              onChange={(e) => setP1Type2(e.target.value)}
              className="input w-full"
              placeholder="e.g., Ground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Sprite URL (optional)
            </label>
            <input
              type="text"
              value={p1Sprite}
              onChange={(e) => setP1Sprite(e.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Player 2 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-poke-accent">Player 2</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Pokémon Name
            </label>
            <div className="flex gap-2">
              {p2Custom ? (
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Delta Charizard"
                />
              ) : (
                <PokemonAutocomplete
                  value={p2Name}
                  onChange={setP2Name}
                  placeholder="e.g., Charizard"
                  className="flex-1"
                />
              )}
              {!p2Custom && (
                <button
                  type="button"
                  onClick={() =>
                    handleFetchPokemon(p2Name, setP2Type1, setP2Type2, setP2Sprite)
                  }
                  disabled={loading}
                  className="btn-secondary"
                >
                  Fetch
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="p2Custom"
              checked={p2Custom}
              onChange={(e) => setP2Custom(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="p2Custom" className="text-sm text-slate-300">
              Custom Pokémon (not in PokéAPI)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Primary Type
            </label>
            <input
              type="text"
              value={p2Type1}
              onChange={(e) => setP2Type1(e.target.value)}
              className="input w-full"
              placeholder="e.g., Fire"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Secondary Type (optional)
            </label>
            <input
              type="text"
              value={p2Type2}
              onChange={(e) => setP2Type2(e.target.value)}
              className="input w-full"
              placeholder="e.g., Flying"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Sprite URL (optional)
            </label>
            <input
              type="text"
              value={p2Sprite}
              onChange={(e) => setP2Sprite(e.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Loading..." : "Create Pair"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditPairForm({
  pair,
  onSuccess,
  onCancel,
}: {
  pair: Pair;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const updatePair = useAppStore((state) => state.updatePair);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Player 1 state
  const [p1Name, setP1Name] = useState(pair.player1.name);
  const [p1Custom, setP1Custom] = useState(pair.player1.custom);
  const [p1Type1, setP1Type1] = useState(pair.player1.primaryType || "");
  const [p1Type2, setP1Type2] = useState(pair.player1.secondaryType || "");
  const [p1Sprite, setP1Sprite] = useState(pair.player1.spriteUrl || "");
  const [p1Notes, setP1Notes] = useState(pair.player1.notes || "");

  // Player 2 state
  const [p2Name, setP2Name] = useState(pair.player2.name);
  const [p2Custom, setP2Custom] = useState(pair.player2.custom);
  const [p2Type1, setP2Type1] = useState(pair.player2.primaryType || "");
  const [p2Type2, setP2Type2] = useState(pair.player2.secondaryType || "");
  const [p2Sprite, setP2Sprite] = useState(pair.player2.spriteUrl || "");
  const [p2Notes, setP2Notes] = useState(pair.player2.notes || "");

  const handleFetchPokemon = async (
    name: string,
    setType1: (v: string) => void,
    setType2: (v: string) => void,
    setSprite: (v: string) => void
  ) => {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const data = await getPokemonByName(name);
      setType1(data.types[0]?.type.name || "");
      setType2(data.types[1]?.type.name || "");
      setSprite(
        data.sprites.other?.["official-artwork"]?.front_default ||
          data.sprites.front_default ||
          ""
      );
    } catch (err) {
      setError("Pokémon not found. Enable custom mode to add manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name || !p2Name) {
      setError("Both Pokémon names are required");
      return;
    }

    const updatedPlayer1: PokemonBase = {
      ...pair.player1,
      name: p1Name,
      speciesKey: p1Name.toLowerCase().replace(/\s+/g, "-"),
      primaryType: p1Type1 || undefined,
      secondaryType: p1Type2 || null,
      spriteUrl: p1Sprite || null,
      custom: p1Custom,
      notes: p1Notes || undefined,
    };

    const updatedPlayer2: PokemonBase = {
      ...pair.player2,
      name: p2Name,
      speciesKey: p2Name.toLowerCase().replace(/\s+/g, "-"),
      primaryType: p2Type1 || undefined,
      secondaryType: p2Type2 || null,
      spriteUrl: p2Sprite || null,
      custom: p2Custom,
      notes: p2Notes || undefined,
    };

    updatePair(pair.id, {
      player1: updatedPlayer1,
      player2: updatedPlayer2,
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Edit Pair</h2>

      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Player 1 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-poke-accent">Player 1</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Pokémon Name
            </label>
            <div className="flex gap-2">
              {p1Custom ? (
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Delta Charizard"
                />
              ) : (
                <PokemonAutocomplete
                  value={p1Name}
                  onChange={setP1Name}
                  placeholder="e.g., Garchomp"
                  className="flex-1"
                />
              )}
              {!p1Custom && (
                <button
                  type="button"
                  onClick={() =>
                    handleFetchPokemon(p1Name, setP1Type1, setP1Type2, setP1Sprite)
                  }
                  disabled={loading}
                  className="btn-secondary"
                >
                  Fetch
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="p1CustomEdit"
              checked={p1Custom}
              onChange={(e) => setP1Custom(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="p1CustomEdit" className="text-sm text-slate-300">
              Custom Pokémon (not in PokéAPI)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Primary Type
            </label>
            <input
              type="text"
              value={p1Type1}
              onChange={(e) => setP1Type1(e.target.value)}
              className="input w-full"
              placeholder="e.g., Dragon"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Secondary Type (optional)
            </label>
            <input
              type="text"
              value={p1Type2}
              onChange={(e) => setP1Type2(e.target.value)}
              className="input w-full"
              placeholder="e.g., Ground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Sprite URL (optional)
            </label>
            <input
              type="text"
              value={p1Sprite}
              onChange={(e) => setP1Sprite(e.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={p1Notes}
              onChange={(e) => setP1Notes(e.target.value)}
              className="input w-full"
              placeholder="e.g., Evolved from Gabite at level 48"
              rows={2}
            />
          </div>
        </div>

        {/* Player 2 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-poke-accent">Player 2</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Pokémon Name
            </label>
            <div className="flex gap-2">
              {p2Custom ? (
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Delta Charizard"
                />
              ) : (
                <PokemonAutocomplete
                  value={p2Name}
                  onChange={setP2Name}
                  placeholder="e.g., Charizard"
                  className="flex-1"
                />
              )}
              {!p2Custom && (
                <button
                  type="button"
                  onClick={() =>
                    handleFetchPokemon(p2Name, setP2Type1, setP2Type2, setP2Sprite)
                  }
                  disabled={loading}
                  className="btn-secondary"
                >
                  Fetch
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="p2CustomEdit"
              checked={p2Custom}
              onChange={(e) => setP2Custom(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="p2CustomEdit" className="text-sm text-slate-300">
              Custom Pokémon (not in PokéAPI)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Primary Type
            </label>
            <input
              type="text"
              value={p2Type1}
              onChange={(e) => setP2Type1(e.target.value)}
              className="input w-full"
              placeholder="e.g., Fire"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Secondary Type (optional)
            </label>
            <input
              type="text"
              value={p2Type2}
              onChange={(e) => setP2Type2(e.target.value)}
              className="input w-full"
              placeholder="e.g., Flying"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Sprite URL (optional)
            </label>
            <input
              type="text"
              value={p2Sprite}
              onChange={(e) => setP2Sprite(e.target.value)}
              className="input w-full"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={p2Notes}
              onChange={(e) => setP2Notes(e.target.value)}
              className="input w-full"
              placeholder="e.g., Evolved from Charmeleon"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Loading..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CompactPairCard({
  pair,
  onEdit,
  onMarkDead,
  onDelete,
}: {
  pair: Pair;
  onEdit?: () => void;
  onMarkDead?: () => void;
  onDelete?: () => void;
}) {
  const isDead = pair.status === "Dead";

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
    <div className={`card relative p-4 ${isDead ? "opacity-60 grayscale" : ""} transition-all`}>
      {isDead && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-20 rounded-xl flex items-center justify-center z-10">
          <span className="text-4xl text-red-500 font-bold">✕</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold">
            {isDead ? "💀 Dead" : "💚 Active"}
          </span>
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs px-2 py-1 bg-poke-dark hover:bg-poke-hover rounded transition-colors"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {!isDead && onMarkDead && (
              <button
                onClick={onMarkDead}
                className="text-xs px-2 py-1 bg-red-900 hover:bg-red-800 rounded transition-colors"
                title="Mark Dead"
              >
                💀
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs px-2 py-1 bg-poke-dark hover:bg-poke-hover rounded transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Pokemon 1 */}
        <div className="bg-poke-dark rounded-lg p-2">
          <div className="flex items-center gap-2">
            {pair.player1.spriteUrl ? (
              <img
                src={pair.player1.spriteUrl}
                alt={pair.player1.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-poke-card rounded flex items-center justify-center text-xl">
                ?
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">
                {pair.player1.name}
              </div>
              <div className="flex gap-1 flex-wrap">
                {pair.player1.primaryType && (
                  <span
                    className={`${
                      typeColors[pair.player1.primaryType.toLowerCase()] || "bg-gray-500"
                    } px-1.5 py-0.5 rounded text-white text-xs capitalize`}
                  >
                    {pair.player1.primaryType}
                  </span>
                )}
                {pair.player1.secondaryType && (
                  <span
                    className={`${
                      typeColors[pair.player1.secondaryType.toLowerCase()] || "bg-gray-500"
                    } px-1.5 py-0.5 rounded text-white text-xs capitalize`}
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
          <span className="text-poke-accent font-bold text-sm">×</span>
        </div>

        {/* Pokemon 2 */}
        <div className="bg-poke-dark rounded-lg p-2">
          <div className="flex items-center gap-2">
            {pair.player2.spriteUrl ? (
              <img
                src={pair.player2.spriteUrl}
                alt={pair.player2.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-poke-card rounded flex items-center justify-center text-xl">
                ?
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">
                {pair.player2.name}
              </div>
              <div className="flex gap-1 flex-wrap">
                {pair.player2.primaryType && (
                  <span
                    className={`${
                      typeColors[pair.player2.primaryType.toLowerCase()] || "bg-gray-500"
                    } px-1.5 py-0.5 rounded text-white text-xs capitalize`}
                  >
                    {pair.player2.primaryType}
                  </span>
                )}
                {pair.player2.secondaryType && (
                  <span
                    className={`${
                      typeColors[pair.player2.secondaryType.toLowerCase()] || "bg-gray-500"
                    } px-1.5 py-0.5 rounded text-white text-xs capitalize`}
                  >
                    {pair.player2.secondaryType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-slate-500 text-center">
          {new Date(pair.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

