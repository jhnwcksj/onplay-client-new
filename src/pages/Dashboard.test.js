import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

test('renders Dashboard header', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1, name: /Сводка/i })).toBeInTheDocument();
});
