import React from 'react';

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '16px', padding: '40px',
          background: '#050b14', color: '#e2e8f0', fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: '40px' }}>⚠️</div>
          <h2 style={{ color: '#f87171', fontSize: '20px', margin: 0 }}>App Crash — Runtime Error</h2>
          <pre style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '20px', maxWidth: '800px', width: '100%',
            fontSize: '13px', color: '#fca5a5', whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack?.slice(0, 800)}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37', fontWeight: 600,
            }}
          >🔄 Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
