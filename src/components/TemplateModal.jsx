import { useState } from 'react';

const blank = { name: '', type: 'enemy', maxHp: '', ac: '', initiativeMod: '' };

export default function TemplateModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          type: initial.type,
          maxHp: String(initial.maxHp),
          ac: initial.ac != null ? String(initial.ac) : '',
          initiativeMod: initial.initiativeMod != null ? String(initial.initiativeMod) : '',
        }
      : blank
  );

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const maxHp = parseInt(form.maxHp, 10);
    if (isNaN(maxHp) || maxHp < 1) return;
    const ac = form.ac !== '' ? parseInt(form.ac, 10) : null;
    const initiativeMod = form.initiativeMod !== '' ? parseInt(form.initiativeMod, 10) : null;

    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name,
      type: form.type,
      maxHp,
      ac: !isNaN(ac) && ac !== null ? ac : null,
      initiativeMod: initiativeMod !== null && !isNaN(initiativeMod) ? initiativeMod : null,
    });
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 150 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{initial ? `Edit "${initial.name}"` : 'New Template'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Name</label>
              <input type="text" placeholder="Goblin, Fighter…" value={form.name}
                onChange={e => set('name', e.target.value)} required autoFocus />
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

          <div className="form-row">
            <div className="form-group">
              <label>Max HP</label>
              <input type="number" min="1" placeholder="20" value={form.maxHp}
                onChange={e => set('maxHp', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>AC (opt)</label>
              <input type="number" min="1" placeholder="13" value={form.ac}
                onChange={e => set('ac', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Init Mod</label>
              <input type="number" placeholder="blank=20" value={form.initiativeMod}
                onChange={e => set('initiativeMod', e.target.value)} />
            </div>
          </div>

          <p className="form-hint">
            {form.initiativeMod !== ''
              ? `When added to combat: rolls d20 ${parseInt(form.initiativeMod, 10) >= 0 ? '+' : ''}${form.initiativeMod}`
              : 'Initiative mod blank → always added at initiative 20'}
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{initial ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
