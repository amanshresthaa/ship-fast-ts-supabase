import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedbackIcon from './FeedbackIcon';

describe('FeedbackIcon', () => {
  test('renders correct icon (✓) for type "correct"', () => {
    render(<FeedbackIcon type="correct" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✓').className).toContain('bg-success-gradient');
  });

  test('renders incorrect icon (✗) for type "incorrect"', () => {
    render(<FeedbackIcon type="incorrect" />);
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('✗').className).toContain('bg-error-gradient');
  });

  test('applies additional className when provided', () => {
    const additionalClass = 'my-custom-class';
    render(<FeedbackIcon type="correct" className={additionalClass} />);
    expect(screen.getByText('✓').className).toContain(additionalClass);
  });

  test('renders correct icon with displayName for debugging', () => {
    expect(FeedbackIcon.displayName).toBe('FeedbackIcon');
  });
});
