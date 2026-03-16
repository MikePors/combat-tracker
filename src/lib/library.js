// Library: saved templates (combatant stat blocks) and groups of templates.
//
// Template: { id, name, type, maxHp, ac, initiativeMod }
//   - initiativeMod: number | null
//   - when adding to combat: initiative = d20 + initiativeMod, or 20 if null
//
// Group: { id, name, entries: [{ templateId, count }] }

import { useState, useEffect } from 'react';

const LIBRARY_KEY = 'ttrpg-library-v1';

function load() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : { templates: [], groups: [] };
  } catch {
    return { templates: [], groups: [] };
  }
}

function save(lib) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  } catch { /* ignore */ }
}

export function useLibrary() {
  const [library, setLibrary] = useState(load);

  useEffect(() => {
    save(library);
  }, [library]);

  // ── Templates ────────────────────────────────────────────────────────────

  function saveTemplate(data) {
    // data may include id (edit) or not (new)
    setLibrary(lib => {
      const exists = lib.templates.some(t => t.id === data.id);
      const templates = exists
        ? lib.templates.map(t => t.id === data.id ? { ...t, ...data } : t)
        : [...lib.templates, { ...data, id: data.id ?? crypto.randomUUID() }];
      return { ...lib, templates };
    });
  }

  function deleteTemplate(id) {
    setLibrary(lib => ({
      templates: lib.templates.filter(t => t.id !== id),
      // Remove references from groups; clean up empty entries
      groups: lib.groups.map(g => ({
        ...g,
        entries: g.entries.filter(e => e.templateId !== id),
      })).filter(g => g.entries.length > 0),
    }));
  }

  // ── Groups ────────────────────────────────────────────────────────────────

  function saveGroup(data) {
    setLibrary(lib => {
      const exists = lib.groups.some(g => g.id === data.id);
      const groups = exists
        ? lib.groups.map(g => g.id === data.id ? { ...g, ...data } : g)
        : [...lib.groups, { ...data, id: data.id ?? crypto.randomUUID() }];
      return { ...lib, groups };
    });
  }

  function deleteGroup(id) {
    setLibrary(lib => ({ ...lib, groups: lib.groups.filter(g => g.id !== id) }));
  }

  return { library, saveTemplate, deleteTemplate, saveGroup, deleteGroup };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function roll20() {
  return Math.floor(Math.random() * 20) + 1;
}

/** Convert a template to a combat-ready combatant instance. */
export function templateToCombatant(template, suffix = '') {
  const mod = template.initiativeMod != null ? Number(template.initiativeMod) : null;
  const initiative = mod != null ? roll20() + mod : 20;
  return {
    id: crypto.randomUUID(),
    name: suffix ? `${template.name} ${suffix}` : template.name,
    type: template.type,
    ac: template.ac ?? null,
    initiative,
    conditions: [],
  };
}

/** Expand a group into an array of combatant instances. */
export function groupToCombatants(group, templates) {
  const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));
  const combatants = [];
  for (const { templateId, count } of group.entries) {
    const tpl = templateMap[templateId];
    if (!tpl) continue;
    for (let i = 0; i < count; i++) {
      const suffix = count > 1 ? i + 1 : '';
      combatants.push(templateToCombatant(tpl, suffix));
    }
  }
  return combatants;
}
