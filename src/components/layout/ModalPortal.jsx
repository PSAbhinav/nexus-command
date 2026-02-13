import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal - Renders modal content at document.body level using React Portal.
 * This fixes the issue where CSS transforms on parent elements break position:fixed.
 * Also locks body scroll while modal is open.
 */
export default function ModalPortal({ children, onClose }) {
    useEffect(() => {
        document.body.classList.add('modal-open');
        const handleEsc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
            {children}
        </div>,
        document.body
    );
}
