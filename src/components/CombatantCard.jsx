import { useState } from 'react';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhausted', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

export default function CombatantCard({ combatant, isActive, onEdit, onRemove, onToggleCondition }) {
  const [expanded, setExpanded] = useState(false);

  const { name, initiative, ac, type, conditions } = combatant;

  return (
    <div className={`combatant-card${isActive ? ' is-active' : ''}`}>
      {/* Main row */}
      <div className="card-main" onClick={() => setExpanded(e => !e)}>
        <div className="init-badge">{initiative}</div>

        <div className="card-info">
          <div className={`card-name ${type}`}>{name}</div>
          <div className="card-meta">
            {ac != null && <span className="ac-text">🛡 {ac}</span>}
            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {type}
            </span>
          </div>
        </div>

        {isActive && <div className="turn-indicator" />}
        <button
          className={`card-expand btn-icon${expanded ? ' open' : ''}`}
          onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
          style={{ width: 28, height: 28, background: 'transparent' }}
        >
          ▾
        </button>
      </div>

      {/* Active conditions summary */}
      {conditions.length > 0 && !expanded && (
        <div className="conditions-row">
          {conditions.map(c => (
            <span key={c} className="condition-badge">{c}</span>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="card-detail">
          {/* Conditions */}
          <div className="conditions-section">
            <label>Conditions</label>
            <div className="conditions-grid">
              {CONDITIONS.map(cond => (
                <button
                  key={cond}
                  className={`condition-toggle${conditions.includes(cond) ? ' active' : ''}`}
                  onClick={() => onToggleCondition(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions">
            <button className="btn-secondary" onClick={onEdit}>✏ Edit</button>
            <button className="btn-danger" onClick={onRemove}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}
