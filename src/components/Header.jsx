import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <h1>AI Dev Quiz</h1>
      <nav>
        <NavLink to="/" end>Quizzes</NavLink>
        <NavLink to="/progress">Progress</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
    </header>
  );
}
