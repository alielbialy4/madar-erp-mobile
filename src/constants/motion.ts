export const motion = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 320,
  },
  spring: {
    default: { friction: 9, tension: 120 },
    snappy: { friction: 8, tension: 140 },
    gentle: { friction: 10, tension: 80 },
  },
  stagger: {
    listItem: 40,
    chip: 30,
  },
} as const;
