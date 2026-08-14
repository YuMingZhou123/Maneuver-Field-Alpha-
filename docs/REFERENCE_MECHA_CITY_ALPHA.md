# Mecha City Arena Reference and Demo Specification

## Purpose

This document translates the broad appeal of anime-styled mecha urban arena games
into an original prototype specification for Maneuver Field Alpha. It is a
gameplay reference, not a reproduction specification. No existing game's
characters, maps, UI, names, assets, music, dialogue, or visual identity may be
copied into this project.

## Reference Pillars

- **Urban verticality:** Streets, buildings, roofs, ramps, and cover create
  alternate routes instead of a flat shooting range.
- **Mecha mobility:** A heavy-looking unit still needs responsive acceleration,
  turning, boosts, and readable movement effects.
- **Third-person combat readability:** Players need to understand aim direction,
  targets, incoming danger, weapon cooldown, health, and energy at a glance.
- **Short combat loops:** Move into a firing position, attack, disengage with a
  boost, then reposition before the next exchange.
- **Mode-ready foundation:** The same moment-to-moment controls should later
  support training, survival, team combat, and networked matches.

## Original Demo Scope

The first prototype is a single-player urban skirmish. The player pilots an
original test mecha called the **Astra Frame** and clears hostile training drones
from a small city block.

### Required Player Actions

- Move in eight directions.
- Aim independently from movement.
- Fire a medium-range pulse cannon.
- Boost through danger using a limited energy meter.
- Use cover and arena routes to break enemy fire.

### Required Game States

- Start screen.
- Active match.
- Victory after all drones are cleared.
- Defeat when the player health reaches zero.
- Restart without a page reload.

## Arena Design

The arena is an original greybox city block:

- A central plaza for dangerous sightlines.
- Four large building masses that create routes and occlusion.
- Smaller barriers for short-term cover.
- A perimeter lane that rewards boost movement.
- Distributed enemy spawns so the player must rotate rather than camp.

The purpose is to validate combat space, not final art direction.

## Player Specification

| System | Initial rule |
| --- | --- |
| Health | 100 hit points |
| Energy | 100 points, consumed by boost and restored over time |
| Movement | Responsive acceleration with a controlled top speed |
| Boost | Fast directional burst with short cooldown |
| Weapon | Pulse shots, finite fire interval, visible projectile trail |
| Feedback | Damage flash, boost trail, impact particles, camera shake |

## Enemy Specification

Training drones use a simple but complete combat loop:

1. Acquire the player when within range.
2. Navigate toward a preferred firing distance.
3. Fire slow, readable pulse shots.
4. Take damage and briefly flash on impact.
5. Explode into particles when destroyed.

This is intentionally simple. The first question is whether moving, boosting,
shooting, and using cover feel good on a small urban map.

## Browser Demo Controls

| Action | Desktop control | Touch control |
| --- | --- | --- |
| Move | WASD / arrow keys | Left virtual stick |
| Aim | Pointer position | Drag on right arena area |
| Fire | Left pointer button | FIRE button |
| Boost | Shift or Space | BOOST button |
| Restart | R | RESTART button |

## Demo Acceptance Criteria

- The game opens directly in a modern browser.
- The player can move, aim, shoot, and boost.
- The arena includes buildings and cover.
- At least six enemies enter the combat loop.
- Health, energy, score, and remaining enemy count are visible.
- The game reaches a victory or defeat state.
- Restart returns to a fresh match without reloading.
- No visual or content asset from the reference game is used.

## Unity Mapping

The browser prototype is a feel test. The eventual Unity implementation maps
directly to the planned architecture:

| Browser prototype | Unity implementation |
| --- | --- |
| Keyboard/touch input | IInputProvider / MobileInputProvider |
| Astra Frame movement | MechaMotor / MechaController |
| Pointer camera direction | ThirdPersonCameraController |
| Pulse cannon | WeaponController / Projectile |
| Boost | BoostSkill |
| Drone logic | EnemyController |
| Arena blocks | Greybox Arena scene |
| HUD | HUDController |
| Tunable values | ScriptableObject configs |

## Expansion After Validation

Only after the demo loop is fun should the project add:

1. A second original mecha configuration.
2. Different weapon and boost behaviours.
3. Rooftop and ramp traversal.
4. More purposeful AI roles.
5. Match objectives and a second arena.
6. Small-scale multiplayer research.

