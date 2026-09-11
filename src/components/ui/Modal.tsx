import { useEffect, useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { IconClose } from './Icons'

/** Fenêtre modale : fermeture par Échap, clic sur le fond, ou bouton. */
export function Modal({ title, onClose, children, footer, wide = false }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} style={wide ? { maxWidth: 720 } : undefined}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={17} />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  )
}

/** Modale contenant un formulaire (soumission au clavier incluse). */
export function FormModal({ title, onClose, onSubmit, submitLabel = 'Enregistrer', children, wide }: {
  title: string
  onClose: () => void
  onSubmit: () => void
  submitLabel?: string
  children: ReactNode
  wide?: boolean
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }
  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Supprimer', onConfirm, onClose }: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal-body"><p className="secondary">{message}</p></div>
      <div className="modal-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-danger" onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}
