import { Component, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

class ThrowingChild extends Component<{ message: string }> {
  render(): ReactNode {
    throw new Error(this.props.message);
  }
}

describe('ErrorBoundary', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => consoleError.mockClear());
  afterEach(() => consoleError.mockClear());

  it('shows a safe message instead of an internal exception message', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="PostgrestError: relation private_users does not exist" />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    const userMessage = screen.getByText('Something went wrong. Please try again.');
    expect(userMessage).toBeVisible();
    expect(userMessage).not.toHaveTextContent('PostgrestError');
  });
});
