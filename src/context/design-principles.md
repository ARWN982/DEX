# Design Principles

## Visual Hierarchy & Contrast

- **Design Tools Inversion:** Design tools (comments, toolbar, job stories) use colors opposite to the main theme — dark tools on light theme, light tools on dark theme for clear visual distinction
- **Design Tools Iconography:** Design tools should use Phosphor Icons only.
- **Layered Interface:** Main application uses EUI theme, design overlays use contrasting color system
- **Z-index Management:** Comments and design tools float above main content with proper layering

## Interaction Design

- **Figma-inspired UX:** Click anywhere to add comments, similar to Figma's interaction paradigm
- **Progressive Disclosure:** Features like job stories tracking and commenting can be toggled on/off
- **Non-intrusive Overlays:** Design tools don't interfere with main application functionality

## Component Architecture

- **Single Responsibility:** Each component has one clear purpose (`CommentPin`, `CommentThread`, `CommentCreator`)
- **Composable System:** Components work together but can be used independently
- **State Separation:** Design tools have separate stores from main application data

## Visual Consistency

- **Rounded Corners:** 16px for panels, 8px for buttons/inputs, 28px for toolbars
- **Shadow System:** Three-tier shadow system (light/medium/heavy) for depth
- **Color Harmony:** Consistent accent colors across light/dark modes (blue, green, orange, red, purple)

## Accessibility & Usability

- **Theme Awareness:** All components respect light/dark mode preferences
- **Clear Visual States:** Active, inactive, and hover states clearly distinguished
- **Semantic Naming:** Color variables have clear semantic meaning (primary, secondary, accent, etc.)

## Technical Philosophy

- **Named Exports:** Consistent use of named exports over default exports
- **Barrel Exports:** Components exported through `index.ts` files for clean imports
- **TypeScript-First:** Strong typing for all interfaces and props
