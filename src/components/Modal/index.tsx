import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Modal({ isOpen, onClose, children, title, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >      
      {/* Modal content */}
      <div 
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: className?.includes('max-w-') ? undefined : '800px',
          backgroundColor: 'white',
          borderRadius: '25px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 1000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9CA3AF',
            zIndex: 1000001,
            fontSize: '24px',
            lineHeight: 1,
            padding: '4px'
          }}
          aria-label="Close modal"
        >
          ×
        </button>
        
        {title && (
          <h3 style={{
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '28px',
            color: '#111827',
            marginBottom: '16px',
            marginRight: '40px'
          }}>
            {title}
          </h3>
        )}
        
        {children}
      </div>
    </div>
  )
} 