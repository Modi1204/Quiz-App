import { useCallback } from 'react';
import AsyncState from '../components/AsyncState';
import QuizCard from '../components/QuizCard';
import { useAsync } from '../hooks/useAsync';
import { fetchCategories, fetchQuizzes } from '../services/quizApi';

// Resolves to [] (the "empty" state) when there are no quizzes at all.
const loadCatalog = () =>
  Promise.all([fetchCategories(), fetchQuizzes()]).then(([categories, quizzes]) => (quizzes.length ? { categories, quizzes } : []));

export default function Home() {
  const loader = useCallback(loadCatalog, []);
  const { status, data, error, retry } = useAsync(loader);

  return (
    <>
      <section className="hero">
        <h2>Test your AI development skills</h2>
        <p>
          Short multiple-choice quizzes on agent design, prompt engineering, workflow automation and AI coding tools.
          Get instant feedback with explanations, review what you missed, and track your progress over time.
        </p>
      </section>

      <AsyncState
        status={status}
        error={error}
        onRetry={retry}
        loadingText="Loading quizzes…"
        emptyTitle="No quizzes available"
        emptyText="There are no quizzes to take right now. Please check back soon."
      >
        {status === 'success' && (
          <div className="catalog">
            {data.categories.map((category) => {
              const quizzes = data.quizzes.filter((q) => q.categoryId === category.id);
              if (!quizzes.length) return null;
              return (
                <section key={category.id} className="category" aria-labelledby={`cat-${category.id}`}>
                  <h3 id={`cat-${category.id}`}>
                    <span aria-hidden="true">{category.icon}</span> {category.name}
                  </h3>
                  <p className="category-desc">{category.description}</p>
                  <div className="grid">
                    {quizzes.map((quiz) => (
                      <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AsyncState>
    </>
  );
}
