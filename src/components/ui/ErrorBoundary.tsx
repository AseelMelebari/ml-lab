import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ML LAB component error:', error, info.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/5 p-6 text-sm">
          <p className="font-semibold text-ink">Something went wrong in this section. · حدث خطأ في هذا القسم.</p>
          <p className="mt-1 font-mono text-xs text-muted">{this.state.error.message}</p>
          <button type="button" className="mt-3 rounded-lg border border-line px-3 py-1.5 text-ink" onClick={this.reset}>
            Retry · إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
