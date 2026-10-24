import { Link } from 'react-router-dom';
import { getResumeInfo } from '../utils/storage';

export default function QuizCard({ quiz }) {
  const resume = getResumeInfo(quiz);
  const label = resume?.status === 'in-progress' ? 'Resume quiz' : resume?.status === 'finished' ? 'View result' : 'Start quiz';

  return (
    <article className="card quiz-card">
      <div className="card-meta">
        <span className={`badge badge-${quiz.difficulty}`}>{quiz.difficulty}</span>
        <span>{quiz.questionCount} questions</span>
      </div>
      <h4>{quiz.title}</h4>
      <p>{quiz.description}</p>
      {resume?.status === 'in-progress' && (
        <p className="resume-note">
          In progress: {resume.currentIndex} of {resume.total} answered
        </p>
      )}
      <Link className="btn btn-link" to={`/quiz/${quiz.id}`} aria-label={`${label}: ${quiz.title}`}>
        {label}
      </Link>
    </article>
  );
}
