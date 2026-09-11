import { useRef, useState } from 'react'
import { useStore } from '../store/store'
import { createEmptyState, createSeedState } from '../data/seed'
import { parseImportedState } from '../store/persistence'
import { Modal } from './ui/Modal'
import { Note, Segmented } from './ui/primitives'
import { IconDownload, IconUpload } from './ui/Icons'
import { today } from '../lib/date'

/** Réglages et gestion des données (export, import, réinitialisation). */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, updateSettings, replaceState } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fintracker-${today()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Sauvegarde téléchargée.')
    setError('')
  }

  const importData = async (file: File) => {
    try {
      replaceState(parseImportedState(await file.text()))
      setMessage('Données importées.')
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import impossible.')
      setMessage('')
    }
  }

  return (
    <Modal title="Réglages et données" onClose={onClose}>
      <div className="modal-body">
        <div className="field">
          <label>Apparence</label>
          <Segmented
            ariaLabel="Thème"
            value={state.settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
              { value: 'system', label: 'Système' },
            ]}
          />
        </div>

        <div className="field">
          <label htmlFor="set-target">Objectif de taux d'épargne (%)</label>
          <input
            id="set-target" className="input" inputMode="numeric" style={{ maxWidth: 140 }}
            value={state.settings.savingsRateTarget}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) updateSettings({ savingsRateTarget: Math.min(Math.max(value, 0), 100) })
            }}
          />
          <span className="hint">Utilisé pour situer votre épargne mensuelle sur le tableau de bord.</span>
        </div>

        <div className="field">
          <label>Devise</label>
          <input className="input" value="MAD — dirham marocain" readOnly style={{ maxWidth: 260 }} />
        </div>

        <div className="field">
          <label>Vos données</label>
          <Note>
            Tout est enregistré dans votre navigateur (stockage local) : aucune donnée n'est envoyée sur Internet.
            Exportez régulièrement une sauvegarde si vous changez d'appareil.
          </Note>
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-sm" onClick={exportData}>
              <IconDownload size={14} /> Exporter (JSON)
            </button>
            <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>
              <IconUpload size={14} /> Importer
            </button>
            <input
              ref={fileInput} type="file" accept="application/json" hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importData(file)
                event.target.value = ''
              }}
            />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button" className="btn btn-sm"
              onClick={() => { replaceState(createSeedState()); setMessage('Jeu de démonstration rechargé.'); setError('') }}
            >
              Recharger les données de démonstration
            </button>
            <button
              type="button" className="btn btn-sm btn-danger"
              onClick={() => { replaceState(createEmptyState()); setMessage('Toutes les données ont été effacées.'); setError('') }}
            >
              Tout effacer
            </button>
          </div>
          {message ? <p className="small pos" style={{ marginTop: 8 }} role="status">{message}</p> : null}
          {error ? <p className="small neg" style={{ marginTop: 8 }} role="alert">{error}</p> : null}
        </div>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  )
}
