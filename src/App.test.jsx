import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { makeCompleted, makeQuiz } from './test/fixtures';
import { loadHistory, recordCompletedAttempt } from './utils/storage';

const mockApi = vi.hoisted(() => ({ fetchCategories: vi.fn(), fetchQuizzes: vi.fn(), fetchQuiz: vi.fn() }));
vi.mock('./services/quizApi', () => mockApi);

const quiz = makeQuiz();
const summary = { ...quiz, questionCount: quiz.questions.length };
delete summary.questions;
const category = { id: 'cat', name: 'Category One', description: 'Cat desc', icon: '★' };

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockApi.fetchCategories.mockResolvedValue([category]);
  mockApi.fetchQuizzes.mockResolvedValue([summary]);
  mockApi.fetchQuiz.mockResolvedValue(structuredClone(quiz));
});

describe('Home page', () => {
  it('shows loading, then quizzes grouped by category', async () => {
    renderAt('/');
    expect(screen.getByText('Loading quizzes…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Category One/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start quiz: Test Quiz' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no quizzes', async () => {
    mockApi.fetchQuizzes.mockResolvedValue([]);
    renderAt('/');
    expect(await screen.findByText('No quizzes available')).toBeInTheDocument();
  });

  it('shows an error and recovers after retry', async () => {
    mockApi.fetchQuizzes.mockRejectedValueOnce(new Error('Service down'));
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Service down');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: /Category One/ })).toBeInTheDocument();
  });
});

describe('Quiz flow', () => {
  const answerAndAdvance = async (user, optionText, nextName) => {
    await user.click(screen.getByRole('button', { name: new RegExp(optionText) }));
    await user.click(screen.getByRole('button', { name: nextName }));
  };

  it('shows an error with a back link when the quiz fails to load, and retries', async () => {
    mockApi.fetchQuiz.mockRejectedValueOnce(new Error('This quiz could not be found.'));
    renderAt('/quiz/test-quiz');
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be found');
    expect(screen.getByRole('link', { name: /Back to all quizzes/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Test Quiz' })).toBeInTheDocument();
  });

  it('completes a quiz, scores it correctly and records one history entry', async () => {
    const user = userEvent.setup();
    renderAt('/quiz/test-quiz');
    await screen.findByRole('heading', { name: 'Test Quiz' });

    // Right, wrong, right, wrong, right => 3/5 = 60%
    for (let i = 1; i <= 5; i += 1) {
      const pick = i % 2 === 1 ? `Right ${i}` : `Wrong ${i}`;
      await answerAndAdvance(user, pick, i === 5 ? 'Finish quiz' : 'Next question');
    }

    expect(await screen.findByText(/3 \/ 5 correct/)).toBeInTheDocument();
    expect(screen.getByText('(60%)')).toBeInTheDocument();
    expect(screen.getByText(/You missed 2 questions/)).toBeInTheDocument();
    await waitFor(() => expect(loadHistory().entries).toHaveLength(1));
    expect(loadHistory().entries[0]).toMatchObject({ score: 3, total: 5, percentage: 60 });
  });

  it('ignores rapid repeated clicks on an option and Next', async () => {
    const user = userEvent.setup();
    renderAt('/quiz/test-quiz');
    await screen.findByRole('heading', { name: 'Test Quiz' });
    const option = screen.getByRole('button', { name: /Right 1/ });
    await user.dblClick(option);
    const next = screen.getByRole('button', { name: 'Next question' });
    await user.dblClick(next);
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('1 answered')).toBeInTheDocument();
  });

  it('resumes after a refresh (remount) at the saved question', async () => {
    const user = userEvent.setup();
    const first = renderAt('/quiz/test-quiz');
    await screen.findByRole('heading', { name: 'Test Quiz' });
    await answerAndAdvance(user, 'Right 1', 'Next question');
    await answerAndAdvance(user, 'Wrong 2', 'Next question');
    first.unmount();

    renderAt('/quiz/test-quiz');
    expect(await screen.findByText(/resuming from question 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText('2 answered')).toBeInTheDocument();
  });

  it('restart asks for confirmation and clears answers', async () => {
    const user = userEvent.setup();
    renderAt('/quiz/test-quiz');
    await screen.findByRole('heading', { name: 'Test Quiz' });
    await user.click(screen.getByRole('button', { name: /Right 1/ }));
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('0 answered')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('retaking after completion adds a second history entry', async () => {
    const user = userEvent.setup();
    renderAt('/quiz/test-quiz');
    await screen.findByRole('heading', { name: 'Test Quiz' });
    for (let i = 1; i <= 5; i += 1) await answerAndAdvance(user, `Right ${i}`, i === 5 ? 'Finish quiz' : 'Next question');
    await screen.findByText('Perfect score!');
    await user.click(screen.getByRole('button', { name: 'Retake quiz' }));
    for (let i = 1; i <= 5; i += 1) await answerAndAdvance(user, `Wrong ${i}`, i === 5 ? 'Finish quiz' : 'Next question');
    await screen.findByText(/0 \/ 5 correct/);
    await waitFor(() => expect(loadHistory().entries.map((e) => e.percentage)).toEqual([100, 0]));
  });

  it('warns when saved progress is invalid', async () => {
    localStorage.setItem(
      'quizapp:activeAttempt',
      JSON.stringify({ 'test-quiz': { schemaVersion: 1, dataVersion: 1, attemptId: 'x', quizId: 'test-quiz', startedAt: 'bad', currentIndex: 0, answers: {} } }),
    );
    renderAt('/quiz/test-quiz');
    expect(await screen.findByText(/could not be restored/)).toBeInTheDocument();
  });
});

describe('Progress page', () => {
  it('shows an empty state', () => {
    renderAt('/progress');
    expect(screen.getByText('No attempts yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse quizzes' })).toBeInTheDocument();
  });

  it('shows stats and a per-quiz attempt table', () => {
    recordCompletedAttempt(makeCompleted({ attemptId: 'a', percentage: 40, score: 2 }));
    recordCompletedAttempt(makeCompleted({ attemptId: 'b', percentage: 80, score: 4, completedAt: '2026-01-02T10:00:00.000Z' }));
    renderAt('/progress');
    expect(screen.getByText('Average score').nextSibling).toHaveTextContent('60%');
    expect(screen.getByText('Best score').nextSibling).toHaveTextContent('80%');
    expect(screen.getByText('Attempts').nextSibling).toHaveTextContent('2');
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('img', { name: /Score trend/ })).toBeInTheDocument();
  });

  it('warns about corrupt and invalid history', () => {
    localStorage.setItem('quizapp:history', 'garbage');
    renderAt('/progress');
    expect(screen.getByRole('alert')).toHaveTextContent('unreadable');
  });

  it('reports skipped invalid records', () => {
    localStorage.setItem('quizapp:history', JSON.stringify([makeCompleted(), { bad: 1 }]));
    renderAt('/progress');
    expect(screen.getByText(/1 saved record was damaged/)).toBeInTheDocument();
  });

  it('clears history after confirmation', async () => {
    recordCompletedAttempt(makeCompleted());
    renderAt('/progress');
    await userEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Clear history' }));
    expect(screen.getByText('No attempts yet')).toBeInTheDocument();
    expect(loadHistory().entries).toEqual([]);
  });
});

describe('Routing and layout', () => {
  it('renders About', () => {
    renderAt('/about');
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders NotFound for unknown routes', () => {
    renderAt('/does-not-exist');
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
