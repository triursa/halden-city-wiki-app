export interface Section {
  key: string;
  label: string;
  icon: string;
  subfolder: string;
  color: string;
}

export const SECTIONS: Section[] = [
  { key: 'pcs', label: 'Player Characters', icon: '🎭', subfolder: 'characters/pcs', color: '#4fc3f7' },
  { key: 'alliance', label: 'The Alliance', icon: '⚔️', subfolder: 'characters/alliance', color: '#81c784' },
  { key: 'npcs', label: 'NPCs', icon: '👤', subfolder: 'characters/npcs', color: '#ffb74d' },
  { key: 'factions', label: 'Factions', icon: '🏛️', subfolder: 'factions', color: '#e57373' },
  { key: 'locations', label: 'Locations', icon: '📍', subfolder: 'locations', color: '#64b5f6' },
  { key: 'lore', label: 'Lore', icon: '📜', subfolder: 'lore', color: '#ba68c8' },
  { key: 'plot', label: 'Plot', icon: '📖', subfolder: 'plot', color: '#f06292' },
  { key: 'villains', label: 'Villains', icon: '😈', subfolder: 'plot/villain-sheets', color: '#ef5350' },
  { key: 'meta', label: 'Meta', icon: '📋', subfolder: 'meta', color: '#90a4ae' },
];

export const SECTION_MAP = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

export function getSection(key: string): Section | undefined {
  return SECTION_MAP[key];
}