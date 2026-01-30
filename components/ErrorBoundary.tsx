import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', height: '100vh', overflow: 'auto' }}>
                    <h1 style={{ color: '#ef4444' }}>Aplicação Travou (Crash)</h1>
                    <div style={{ backgroundColor: 'black', padding: '15px', borderRadius: '5px', marginTop: '20px', border: '1px solid #333' }}>
                        <h2 style={{ color: '#f87171', margin: 0 }}>Erro:</h2>
                        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{this.state.error?.toString()}</pre>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <h2 style={{ color: '#9ca3af' }}>Stack Trace:</h2>
                        <pre style={{ fontSize: '12px', color: '#6b7280', overflowX: 'auto' }}>
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Tentar Recarregar Tela
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
