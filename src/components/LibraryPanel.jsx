import { useState } from 'react';
import { groupToCombatants, templateToCombatant } from '../lib/library.js';
import TemplateModal from './TemplateModal.jsx';
import GroupModal from './GroupModal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function LibraryPanel({ library, onClose, onAddCombatants, saveTemplate, deleteTemplate, saveGroup, deleteGroup }) {
  const [tab, setTab] = useState('groups');
  const [editTemplate, setEditTemplate] = useState(null);   // null | template | 'new'
  const [editGroup, setEditGroup] = useState(null);         // null | group | 'new'
  const [confirmDelete, setConfirmDelete] = useState(null); // null | { type, id, name }

  const { templates, groups } = library;

  function handleAddTemplate(tpl) {
    onAddCombatants([templateToCombatant(tpl)]);
  }

  function handleAddGroup(grp) {
    const combatants = groupToCombatants(grp, templates);
    if (combatants.length) onAddCombatants(combatants);
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'template') deleteTemplate(confirmDelete.id);
    else deleteGroup(confirmDelete.id);
    setConfirmDelete(null);
  }

  // Helper: list template names used in a group
  function groupSummary(grp) {
    const map = Object.fromEntries(templates.map(t => [t.id, t]));
    return grp.entries
      .map(e => {
        const t = map[e.templateId];
        return t ? (e.count > 1 ? `${e.count}× ${t.name}` : t.name) : null;
      })
      .filter(Boolean)
      .join(', ') || 'Empty group';
  }

  return (
    <>
      <div className="library-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="library-panel">
          {/* Header */}
          <div className="library-header">
            <h2>Library</h2>
            <button className="btn-icon" onClick={onClose} title="Close">✕</button>
          </div>

          {/* Tabs */}
          <div className="lib-tabs">
            <button
              className={`lib-tab${tab === 'groups' ? ' active' : ''}`}
              onClick={() => setTab('groups')}
            >
              Groups
              {groups.length > 0 && <span className="lib-count">{groups.length}</span>}
            </button>
            <button
              className={`lib-tab${tab === 'templates' ? ' active' : ''}`}
              onClick={() => setTab('templates')}
            >
              Templates
              {templates.length > 0 && <span className="lib-count">{templates.length}</span>}
            </button>
          </div>

          {/* Content */}
          <div className="library-content">
            {tab === 'groups' && (
              <>
                <button className="lib-add-btn" onClick={() => setEditGroup('new')}>
                  + New Group
                </button>
                {groups.length === 0 ? (
                  <div className="lib-empty">
                    <div>🗂</div>
                    <p>No groups yet. Create a group to quickly add a pre-built encounter or party.</p>
                  </div>
                ) : (
                  groups.map(grp => (
                    <div key={grp.id} className="lib-card">
                      <div className="lib-card-info">
                        <div className="lib-card-name">{grp.name}</div>
                        <div className="lib-card-meta">{groupSummary(grp)}</div>
                      </div>
                      <div className="lib-card-actions">
                        <button
                          className="lib-btn-add"
                          onClick={() => handleAddGroup(grp)}
                          title="Add group to combat"
                          disabled={grp.entries.length === 0}
                        >
                          + Combat
                        </button>
                        <button
                          className="btn-icon lib-btn-sm"
                          onClick={() => setEditGroup(grp)}
                          title="Edit group"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon lib-btn-sm lib-btn-del"
                          onClick={() => setConfirmDelete({ type: 'group', id: grp.id, name: grp.name })}
                          title="Delete group"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {tab === 'templates' && (
              <>
                <button className="lib-add-btn" onClick={() => setEditTemplate('new')}>
                  + New Template
                </button>
                {templates.length === 0 ? (
                  <div className="lib-empty">
                    <div>📋</div>
                    <p>No templates yet. Save a combatant's stat block to reuse across sessions.</p>
                  </div>
                ) : (
                  templates.map(tpl => (
                    <div key={tpl.id} className="lib-card">
                      <div className="lib-card-info">
                        <div className="lib-card-name">
                          {tpl.name}
                          <span className={`lib-type-badge ${tpl.type}`}>{tpl.type}</span>
                        </div>
                        <div className="lib-card-meta">
                          {tpl.maxHp}HP
                          {tpl.ac != null && ` · AC ${tpl.ac}`}
                          {tpl.initiativeMod != null
                            ? ` · Init d20${tpl.initiativeMod >= 0 ? '+' : ''}${tpl.initiativeMod}`
                            : ' · Init 20'}
                        </div>
                      </div>
                      <div className="lib-card-actions">
                        <button
                          className="lib-btn-add"
                          onClick={() => handleAddTemplate(tpl)}
                          title="Add to combat"
                        >
                          + Combat
                        </button>
                        <button
                          className="btn-icon lib-btn-sm"
                          onClick={() => setEditTemplate(tpl)}
                          title="Edit template"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon lib-btn-sm lib-btn-del"
                          onClick={() => setConfirmDelete({ type: 'template', id: tpl.id, name: tpl.name })}
                          title="Delete template"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Template create/edit modal */}
      {editTemplate && (
        <TemplateModal
          initial={editTemplate === 'new' ? null : editTemplate}
          onSave={(data) => { saveTemplate(data); setEditTemplate(null); }}
          onClose={() => setEditTemplate(null)}
        />
      )}

      {/* Group create/edit modal */}
      {editGroup && (
        <GroupModal
          initial={editGroup === 'new' ? null : editGroup}
          templates={templates}
          onSave={(data) => { saveGroup(data); setEditGroup(null); }}
          onClose={() => setEditGroup(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          message={
            confirmDelete.type === 'template'
              ? 'This template will be removed from all groups that use it.'
              : 'The group will be deleted. Templates inside it are not affected.'
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
