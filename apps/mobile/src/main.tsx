import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ECHO Root Crash Caught]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{
            backgroundColor: '#07080B',
            color: '#E6E8EE',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'Assistant, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '380px',
              padding: '28px 24px',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
            }}
          >
            <div
              style={{
                fontSize: '28px',
                marginBottom: '12px',
                color: '#D4AF37'
              }}
            >
              ◈
            </div>
            <h1
              style={{
                fontFamily: "'Frank Ruhl Libre', serif",
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#D4AF37',
                marginBottom: '8px'
              }}
            >
              echo
            </h1>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px', lineHeight: 1.5 }}>
              חלה שגיאה בלתי צפויה בעת טעינת התצוגה.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  fontSize: '11px',
                  color: 'rgba(230, 232, 238, 0.6)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '10px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  textAlign: 'left',
                  direction: 'ltr'
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                padding: '10px 24px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              טען מחדש ↺
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
