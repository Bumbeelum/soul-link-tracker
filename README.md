# Soul-Link Tracker

A modern web application for managing Pokémon Soul-Link runs. Track linked pairs, enforce death rules, generate valid teams based on customizable constraints, and browse Pokédex data via PokéAPI.

## Features

- ✨ **Pair Management**: Create, edit, and delete Pokémon pairs with automatic death propagation
- 🎯 **Team Builder**: Generate valid team combinations based on customizable Soul-Link constraints
- 📖 **Pokédex**: Search and view detailed Pokémon data (stats, types, abilities, moves) via PokéAPI
- 🎨 **Custom Pokémon**: Support for fan game variants (e.g., Pokémon Insurgence)
- 💾 **Local Storage**: Data persists in your browser with export/import functionality
- 🌙 **Dark Theme**: Beautiful Pokémon-themed dark UI with Tailwind CSS

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS**
- **Zustand** (state management with persistence)
- **PokéAPI** (Pokémon data)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Dashboard
View quick stats about your Soul-Link run, including total pairs, active pairs, and fallen pairs.

### Pairs Manager
- Create new pairs by entering Pokémon names
- Fetch data automatically from PokéAPI or manually enter custom Pokémon
- Mark pairs as dead (propagates to both Pokémon)
- Filter by status (all, active, fallen)
- Delete pairs when needed

### Combination Builder
Set up Soul-Link constraints:
- **Species Clause**: No duplicate Pokémon species
- **Primary Type Clause**: No duplicate primary types
- **Custom Pokémon**: Include/exclude custom variants
- **Team Size**: Choose your team size (default: 6)
- **Version Constraint**: Label your run (optional)

Generate valid team combinations that respect your chosen constraints.

### Pokédex
Search any Pokémon by name or ID to view:
- Base stats with visual bars
- Types and type effectiveness
- Abilities (including hidden abilities)
- Complete move list
- Official artwork

### Settings
- **Export**: Download JSON backup of all data
- **Import**: Restore from backup file
- **Clear Data**: Reset all pairs and settings
- **Statistics**: View storage stats and current constraints

## Data Structure

All data is stored in browser localStorage using Zustand persistence. The data structure includes:

```typescript
{
  pokemon: Record<UUID, PokemonBase>
  pairs: Record<UUID, Pair>
  constraints: SoulLinkConstraints
}
```

Export your data regularly to avoid loss!

## Soul-Link Rules

In a Soul-Link challenge:
1. Two players play separate Pokémon games simultaneously
2. Pokémon caught in the same area/route are "linked" as pairs
3. If one Pokémon in a pair faints, both are considered dead
4. Only linked pairs can be used in battle
5. Standard Nuzlocke rules typically apply (one catch per route, fainted = dead)

This app helps you track your pairs and enforce these rules!

## Customization

### Adding Custom Pokémon
1. Go to Pairs Manager
2. Click "Create Pair"
3. Check "Custom Pokémon" for player 1 or 2
4. Manually enter name, types, and sprite URL
5. Perfect for fan games like Pokémon Insurgence!

### Constraint Presets
Adjust constraints in the Builder page to match your specific Soul-Link variant rules.

## Future Enhancements

- Database sync (Supabase/Firebase)
- Multi-user authentication
- Team analytics and type coverage visualization
- Move planner and strategy tools
- Import from save files

## License

MIT

## Credits

- Pokémon data provided by [PokéAPI](https://pokeapi.co/)
- Built with ❤️ for the Pokémon and Nuzlocke community



