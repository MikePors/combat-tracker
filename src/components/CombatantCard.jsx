import { useState } from 'react';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhausted', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

function hpClass(hp, maxHp) {
  if (hp === 0) return 'dead';
  const pct = hp / maxHp;
  if (pct <= 0.25) return 'critical';
  if (pct <= 0.5)  return 'bloodied';
  return 'healthy';
}

function hpBarClass(hp, maxHp) {
  const cls = hpClass(hp, maxHp);
  return cls === 'healthy' ? 'hp-healthy' : cls === 'bloodied' ? 'hp-bloodied' : 'hp-critical';
}

export default function CombatantCard({ combatant, isActive, onEdit, onRemove, onHPChange, onToggleCondition }) {
  const [expanded, setExpanded] = useState(false);
  const [delta, setDelta] = useState('');

  const { name, initiative, hp, maxHp, ac, type, conditions } = combatant;
  const isDead = hp === 0;
  const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const statusClass = hpClass(hp, maxHp);

  function applyDelta(sign) {
    const amount = parseInt(delta, 10);
    if (!isNaN(amount) && amount > 0) {
      onHPChange(hp + sign * amount);
      setDelta('');
    }
  }

  return (
    <div className={`combatant-card${isActive ? ' is-active' : ''}${isDead ? ' is-dead' : ''}`}>
      {/* Main row */}
      <div className="card-main" onClick={() => setExpanded(e => !e)}>
        <div className="init-badge">{initiative}</div>

        <div className="card-info">
          <div className={`card-name ${type}`}>{name}</div>
          <div className="card-meta">
            <span className={`hp-text ${statusClass}`}>
              ❤ {hp}/{maxHp}
            </span>
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
          {/* HP bar */}
          <div className="hp-bar-wrap">
            <div className={`hp-bar ${hpBarClass(hp, maxHp)}`} style={{ width: `${hpPct}%` }} />
          </div>

          {/* HP controls */}
          <div className="hp-controls">
            <label>HP adjust</label>
            <button
              className="hp-btn btn-danger"
              onClick={() => applyDelta(-1)}
              disabled={!delta || isNaN(parseInt(delta))}
            >–</button>
            <input
              className="hp-input"
              type="number"
              min="1"
              placeholder="0"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="hp-btn btn-success"
              onClick={() => applyDelta(1)}
              disabled={!delta || isNaN(parseInt(delta))}
            >+</button>
            <button
              className="hp-btn btn-secondary"
              onClick={() => { onHPChange(maxHp); setDelta(''); }}
              title="Full heal"
              style={{ fontSize: '0.75rem', width: 36, height: 32 }}
            >MAX</button>
          </div>

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
