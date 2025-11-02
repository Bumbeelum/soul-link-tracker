"use client";

import { useAppStore } from "@/state/store";
import { useState } from "react";
import { AppData } from "@/types/core";

export default function SettingsPage() {
  const pokemon = useAppStore((state) => state.pokemon);
  const pairs = useAppStore((state) => state.pairs);
  const constraints = useAppStore((state) => state.constraints);
  const addPair = useAppStore((state) => state.addPair);
  const setConstraints = useAppStore((state) => state.setConstraints);

  const [exportSuccess, setExportSuccess] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    const data: AppData = {
      pokemon,
      pairs,
      constraints,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soul-link-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data: AppData = JSON.parse(json);

        // Validate data structure
        if (!data.pairs || !data.constraints) {
          throw new Error("Invalid backup file format");
        }

        // Import pairs
        Object.values(data.pairs).forEach((pair) => {
          addPair(pair);
        });

        // Import constraints
        setConstraints(data.constraints);

        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : "Failed to import data"
        );
      }
    };

    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear ALL data? This cannot be undone. Consider exporting first."
      )
    ) {
      // Clear pairs
      Object.keys(pairs).forEach((id) => {
        useAppStore.getState().deletePair(id);
      });

      // Reset constraints to defaults
      setConstraints({
        speciesClause: true,
        primaryTypeClause: true,
        allowCustomPokemon: true,
        versionConstraint: "Any",
        teamSize: 6,
      });

      alert("All data has been cleared.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-poke-accent mb-2">Settings</h1>
        <p className="text-slate-400">
          Manage your data and preferences
        </p>
      </div>

      {/* Data Management */}
      <div className="card">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          Data Management
        </h2>

        <div className="space-y-6">
          {/* Export */}
          <div>
            <h3 className="font-semibold text-slate-100 mb-2">
              Export Data
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Download a JSON backup of all your pairs and settings
            </p>
            <button onClick={handleExport} className="btn-primary">
              Export to JSON
            </button>
            {exportSuccess && (
              <p className="text-green-400 text-sm mt-2">
                ✓ Backup exported successfully!
              </p>
            )}
          </div>

          {/* Import */}
          <div>
            <h3 className="font-semibold text-slate-100 mb-2">
              Import Data
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Restore from a JSON backup file. This will add to your existing data.
            </p>
            <label className="btn-secondary cursor-pointer inline-block">
              Choose File
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {importSuccess && (
              <p className="text-green-400 text-sm mt-2">
                ✓ Data imported successfully!
              </p>
            )}
            {importError && (
              <p className="text-red-400 text-sm mt-2">✗ {importError}</p>
            )}
          </div>

          {/* Clear All */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="font-semibold text-red-400 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete all data. This action cannot be undone.
            </p>
            <button onClick={handleClearAll} className="btn-danger">
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="card">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          Storage Statistics
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Pairs:</span>
            <span className="text-slate-100 font-semibold">
              {Object.keys(pairs).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Active Pairs:</span>
            <span className="text-green-400 font-semibold">
              {Object.values(pairs).filter((p) => p.status === "Alive").length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fallen Pairs:</span>
            <span className="text-red-400 font-semibold">
              {Object.values(pairs).filter((p) => p.status === "Dead").length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Custom Pokémon:</span>
            <span className="text-purple-400 font-semibold">
              {
                Object.values(pairs).filter(
                  (p) => p.player1.custom || p.player2.custom
                ).length
              }
            </span>
          </div>
        </div>
      </div>

      {/* Current Constraints */}
      <div className="card">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          Current Constraints
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Species Clause:</span>
            <span
              className={
                constraints.speciesClause
                  ? "text-green-400 font-semibold"
                  : "text-red-400 font-semibold"
              }
            >
              {constraints.speciesClause ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Primary Type Clause:</span>
            <span
              className={
                constraints.primaryTypeClause
                  ? "text-green-400 font-semibold"
                  : "text-red-400 font-semibold"
              }
            >
              {constraints.primaryTypeClause ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Allow Custom Pokémon:</span>
            <span
              className={
                constraints.allowCustomPokemon
                  ? "text-green-400 font-semibold"
                  : "text-red-400 font-semibold"
              }
            >
              {constraints.allowCustomPokemon ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Team Size:</span>
            <span className="text-slate-100 font-semibold">
              {constraints.teamSize || 6}
            </span>
          </div>
          {constraints.versionConstraint && (
            <div className="flex justify-between">
              <span className="text-slate-400">Version:</span>
              <span className="text-slate-100 font-semibold">
                {constraints.versionConstraint}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          About Soul-Link Tracker
        </h2>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            A web app for managing Pokémon Soul-Link runs. Track linked pairs,
            enforce death rules, generate valid teams, and browse Pokédex data.
          </p>
          <p className="pt-4 text-slate-500">
            Data is stored locally in your browser. Use Export/Import to backup
            and transfer your progress.
          </p>
        </div>
      </div>
    </div>
  );
}



