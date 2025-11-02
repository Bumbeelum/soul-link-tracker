"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllPokemonNames } from "@/services/pokeapi";

interface PokemonAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PokemonAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "e.g., Pikachu",
  disabled = false,
  className = "",
}: PokemonAutocompleteProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [allPokemon, setAllPokemon] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    getAllPokemonNames().then(setAllPokemon).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowAutocomplete(false);
    if (showAutocomplete) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showAutocomplete]);

  const autocompleteResults = useMemo(() => {
    if (!value || value.length < 2) return [];
    const query = value.toLowerCase();
    return allPokemon
      .filter((p) => p.name.includes(query))
      .slice(0, 10);
  }, [value, allPokemon]);

  const handleSelect = (name: string) => {
    onChange(name);
    setShowAutocomplete(false);
    if (onSelect) {
      onSelect(name);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowAutocomplete(true);
        }}
        onFocus={() => setShowAutocomplete(true)}
        disabled={disabled}
        placeholder={placeholder}
        className={`input ${className}`}
      />

      {showAutocomplete && autocompleteResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-poke-card border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {autocompleteResults.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelect(p.name)}
              className="w-full px-4 py-2 text-left hover:bg-poke-hover transition-colors capitalize"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



