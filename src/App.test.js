import { render, screen } from '@testing-library/react';
import App from './App';

<<<<<<< HEAD
test('renders login form', () => {
  render(<App />);
  // app now shows a localized login form — assert the main login button exists
  const loginButton = screen.getByText(/войти/i);
  expect(loginButton).toBeInTheDocument();
=======
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
>>>>>>> 8941728 (Initialize project using Create React App)
});
