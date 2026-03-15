import { useState, useEffect, useCallback } from 'react';
import CombatantCard from './components/CombatantCard.jsx';
import AddCombatantModal from './components/AddCombatantModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';

const STORAGE_KEY = 'ttrpg-combat-tracker-v1';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const initialState = {
  combatants: [],
  activeIndex: 0,
  round: 0,
  inCombat: false,
};

export default function App() {
  const [state, setState] = useState(() => loadState() || initialState);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);

  const { combatants, activeIndex, round, inCombat } = state;

  useEffect(() => {
    saveState(state);
  }, [state]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function addCombatant(data) {
    const sorted = [...combatants, { ...data, id: crypto.randomUUID(), conditions: [] }]
      .sort((a, b) => b.initiative - a.initiative);
    update({ combatants: sorted });
    showToast(`${data.name} added`);
  }

  function editCombatant(id, data) {
    const updated = combatants.map(c => c.id === id ? { ...c, ...data } : c)
      .sort((a, b) => b.initiative - a.initiative);
    // preserve active combatant reference after re-sort
    const activeCombatant = combatants[activeIndex];
    const newIndex = activeCombatant
      ? updated.findIndex(c => c.id === activeCombatant.id)
      : activeIndex;
    update({ combatants: updated, activeIndex: Math.max(0, newIndex) });
    showToast(`${data.name} updated`);
  }

  function removeCombatant(id) {
    const updated = combatants.filter(c => c.id !== id);
    const activeCombatant = combatants[activeIndex];
    let newIndex = activeCombatant
      ? Math.max(0, updated.findIndex(c => c.id === activeCombatant.id))
      : 0;
    if (newIndex === -1 || newIndex >= updated.length) newIndex = 0;
    update({ combatants: updated, activeIndex: newIndex });
  }

  function updateHP(id, newHP) {
    update({
      combatants: combatants.map(c =>
        c.id === id ? { ...c, hp: Math.min(c.maxHp, Math.max(0, newHP)) } : c
      ),
    });
  }

  function toggleCondition(id, condition) {
    update({
      combatants: combatants.map(c => {
        if (c.id !== id) return c;
        const conditions = c.conditions.includes(condition)
          ? c.conditions.filter(x => x !== condition)
          : [...c.conditions, condition];
        return { ...c, conditions };
      }),
    });
  }

  function startCombat() {
    if (combatants.length === 0) return;
    update({ inCombat: true, round: 1, activeIndex: 0 });
    showToast('Combat started! Round 1');
  }

  function nextTurn() {
    if (combatants.length === 0) return;
    const next = (activeIndex + 1) % combatants.length;
    const newRound = next === 0 ? round + 1 : round;
    if (next === 0) showToast(`Round ${newRound} begins`);
    update({ activeIndex: next, round: newRound });
  }

  function prevTurn() {
    if (combatants.length === 0) return;
    const prev = (activeIndex - 1 + combatants.length) % combatants.length;
    update({ activeIndex: prev });
  }

  function doReset() {
    update({ ...initialState });
    setConfirmReset(false);
    showToast('Combat cleared');
  }

  const activeCombatant = inCombat ? combatants[activeIndex] : null;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>⚔ Combat Tracker</h1>
          {inCombat && (
            <span className="round-badge">Round {round} · {combatants.length} combatants</span>
          )}
        </div>
        <div className="header-actions">
          {combatants.length > 0 && (
            <button
              className="btn-icon"
              onClick={() => setConfirmReset(true)}
              title="Reset combat"
            >
              🗑
            </button>
          )}
          {!inCombat && combatants.length > 0 && (
            <button className="btn-primary" onClick={startCombat}>
              ▶ Start
            </button>
          )}
        </div>
      </header>

      {/* Turn controls */}
      {inCombat && combatants.length > 0 && (
        <div className="turn-controls">
          <button className="btn-secondary" onClick={prevTurn} disabled={combatants.length < 2}>
            ◀ Prev
          </button>
          <div className="active-name">
            <div className="turn-indicator" style={{ margin: '0 auto 4px' }} />
            <strong>{activeCombatant?.name ?? '—'}</strong>
            {activeCombatant?.type === 'player' ? ' (PC)' : ' (NPC)'}
          </div>
          <button className="btn-primary" onClick={nextTurn}>
            Next ▶
          </button>
        </div>
      )}

      {/* Combatant list */}
      <main className="combatant-list">
        {combatants.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎲</div>
            <h2>No combatants yet</h2>
            <p>Add players and enemies, then hit Start to begin tracking initiative.</p>
          </div>
        ) : (
          combatants.map((c, i) => (
            <CombatantCard
              key={c.id}
              combatant={c}
              isActive={inCombat && i === activeIndex}
              onEdit={() => setEditTarget(c)}
              onRemove={() => removeCombatant(c.id)}
              onHPChange={(hp) => updateHP(c.id, hp)}
              onToggleCondition={(cond) => toggleCondition(c.id, cond)}
            />
          ))
        )}
      </main>

      {/* FAB – Add combatant */}
      <button className="fab" onClick={() => setShowAdd(true)}>
        + Add Combatant
      </button>

      {/* Modals */}
      {showAdd && (
        <AddCombatantModal
          onAdd={addCombatant}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editTarget && (
        <AddCombatantModal
          initial={editTarget}
          onAdd={(data) => { editCombatant(editTarget.id, data); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset Combat?"
          message="This will remove all combatants and reset the round counter."
          onConfirm={doReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
