# Banner Sprite

Place your banner sprite file in this directory:

- `banner.png` - Single banner pattern (any size, will be scaled appropriately)

The banner will be automatically scaled with integer scaling to fit the arena banner rectangles while maintaining crisp pixel art.

## Usage
- Preloaded with key: `banner`
- Positioned center-bottom aligned to replace red rectangle banners
- Integer scaling only (1x, 2x, 3x, etc.) - no fractional scaling
- Rendered behind gameplay UI (-5 depth)
- Fixed positioning with `setScrollFactor(0)`
- Used for all three banner positions in the arena
