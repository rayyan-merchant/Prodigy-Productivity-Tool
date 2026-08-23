import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AIResponseMarkdown from './AIResponseMarkdown';

describe('AIResponseMarkdown', () => {
  it('renders headings, lists, and nested emphasis from an AI response', () => {
    render(<AIResponseMarkdown>{'## Priorities\n\n- **Complete *important* task**\n- Keep momentum'}</AIResponseMarkdown>);

    expect(screen.getByRole('heading', { name: 'Priorities' })).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getByText((_, element) => element?.tagName === 'STRONG' && element.textContent === 'Complete important task')).toHaveClass('font-semibold');
    expect(screen.getByText('important')).toHaveStyle({ fontStyle: 'italic' });
  });

  it('does not render raw HTML supplied in a response', () => {
    render(<AIResponseMarkdown>{'<img src=x onerror=alert(1)>Safe text'}</AIResponseMarkdown>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Safe text')).toBeVisible();
  });
});
