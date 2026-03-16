import { useState } from 'react';

export default function GroupModal({ initial, templates, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  // entries: [{ templateId, count }]
  const [entries, setEntries] = useState(initial?.entries ? [...initial.entries] : []);

  function addEntry(templateId) {
    setEntries(prev => {
      const existing = prev.find(e => e.templateId === templateId);
      if (existing) {
        return prev.map(e => e.templateId === templateId ? { ...e, count: e.count + 1 } : e);
      }
      return [...prev, { templateId, count: 1 }];
    });
  }

  function setCount(templateId, count) {
    const n = parseInt(count, 10);
    if (isNaN(n) || n < 1) {
      setEntries(prev => prev.filter(e => e.templateId !== templateId));
    } else {
      setEntries(prev => prev.map(e => e.templateId === templateId ? { ...e, count: n } : e));
    }
  }

  function removeEntry(templateId) {
    setEntries(prev => prev.filter(e => e.templateId !== templateId));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: trimmed,
      entries: entries.filter(e => e.count > 0),
    });
  }

  const entryMap = Object.fromEntries(templates.map(t => [t.id, t]));
  // Templates not yet in entries
  const available = templates.filter(t => !entries.find(e => e.templateId === t.id));

  return (
    <div className="modal-overlay" style={{ zIndex: 150 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{initial ? `Edit "${initial.name}"` : 'New Group'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Group Name</label>
            <input type="text" placeholder="Goblin Ambush, The Party…" value={name}
              onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          {/* Current entries */}
          {entries.length > 0 && (
            <div className="group-entries">
              {entries.map(({ templateId, count }) => {
                const tpl = entryMap[templateId];
                if (!tpl) return null;
                return (
                  <div key={templateId} className="group-entry">
                    <span className={`lib-type-badge ${tpl.type}`}>{tpl.type[0].toUpperCase()}</span>
                    <span className="group-entry-name">{tpl.name}</span>
                    <div className="group-entry-count">
                      <button type="button" className="count-btn"
                        onClick={() => setCount(templateId, count - 1)}>–</button>
                      <input
                        type="number" min="1" value={count}
                        className="count-input"
                        onChange={e => setCount(templateId, e.target.value)}
                      />
                      <button type="button" className="count-btn"
                        onClick={() => setCount(templateId, count + 1)}>+</button>
                    </div>
                    <button type="button" className="btn-icon lib-btn-sm lib-btn-del"
                      onClick={() => removeEntry(templateId)} title="Remove">✕</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add from templates */}
          {available.length > 0 && (
            <div className="group-add-section">
              <p className="form-hint">Add templates:</p>
              <div className="group-add-list">
                {available.map(tpl => (
                  <button key={tpl.id} type="button" className="group-add-chip"
                    onClick={() => addEntry(tpl.id)}>
                    <span className={`lib-type-badge ${tpl.type}`}>{tpl.type[0].toUpperCase()}</span>
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <p className="form-hint" style={{ textAlign: 'center', marginBottom: 12 }}>
              Create some templates first, then add them to a group.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={entries.length === 0}>
              {initial ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
