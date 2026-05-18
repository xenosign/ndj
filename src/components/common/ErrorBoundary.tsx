'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex flex-col items-center justify-center min-h-screen gap-4 px-6"
          style={{ backgroundColor: '#1A0A3D' }}
        >
          <p className="text-base font-semibold text-center" style={{ color: '#C4A0E8' }}>
            일시적인 오류가 발생했습니다.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#7B4DBE', color: '#F8F4FF' }}
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
