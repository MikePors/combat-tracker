import { useState } from 'react';

const defaults = {
  name: '',
  type: 'player',
  initiative: '',
  initiativeMod: '0',
  ac: '',
};

function roll20() {
  return Math.floor(Math.random() * 20) + 1;
}

export default function AddCombatantModal({ initial, onAdd, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          type: initial.type,
          initiative: String(initial.initiative),
          initiativeMod: '0',
          ac: initial.ac != null ? String(initial.ac) : '',
        }
      : defaults
  );

  const isEdit = !!initial;

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function rollInit() {
    const mod = parseInt(form.initiativeMod, 10) || 0;
    set('initiative', String(roll20() + mod));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const initiative = parseInt(form.initiative, 10);
    if (isNaN(initiative)) return;
    const ac = form.ac !== '' ? parseInt(form.ac, 10) : null;

    const payload = {
      name,
      type: form.type,
      initiative,
      ac: !isNaN(ac) ? ac : null,
    };
    onAdd(payload);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEdit ? `Edit ${initial.name}` : 'Add Combatant'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Name + type */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Name</label>
              <input
                type="text"
                placeholder="Goblin, Aragorn…"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="player">Player (PC)</option>
                <option value="enemy">Enemy (NPC)</option>
                <option value="ally">Ally</option>
              </select>
            </div>
          </div>

          {/* Initiative */}
          <div className="form-row">
            <div className="form-group">
              <label>Initiative</label>
              <input
                type="number"
                placeholder="15"
                value={form.initiative}
                onChange={e => set('initiative', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Init Mod</label>
              <input
                type="number"
                placeholder="+2"
                value={form.initiativeMod}
                onChange={e => set('initiativeMod', e.target.value)}
              />
            </div>
            <button
              type="button"
              className="roll-btn"
              onClick={rollInit}
              title="Roll d20 + modifier"
            >
              🎲 Roll
            </button>
          </div>

          {/* AC */}
          <div className="form-row">
            <div className="form-group">
              <label>AC (optional)</label>
              <input
                type="number"
                min="1"
                placeholder="14"
                value={form.ac}
                onChange={e => set('ac', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {isEdit ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
