import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { makeCompleted, makeQuiz } from '../test/fixtures';
import AsyncState from './AsyncState';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import Footer from './Footer';
import Header from './Header';
import ProgressBar from './ProgressBar';
import ProgressChart from './ProgressChart';
import QuestionCard from './QuestionCard';
import QuizCard from './QuizCard';
import QuizResult from './QuizResult';
import { saveActiveAttempt } from '../utils/storage';
import { makeActive } from '../test/fixtures';

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Button', () => {
  it('renders children and forwards props', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('AsyncState', () => {
  it('shows a loading status', () => {
    render(<AsyncState status="loading" loadingText="Please wait">child</AsyncState>);
    expect(screen.getByRole('status')).toHaveTextContent('Please wait');
    expect(screen.queryByText('child')).toBeNull();
  });

  it('shows an error with a working retry button', async () => {
    const onRetry = vi.fn();
    render(<AsyncState status="error" error={new Error('Nope')} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Nope');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('falls back to a generic error message', () => {
    render(<AsyncState status="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('unexpected error');
  });

  it('shows custom empty copy', () => {
    render(<AsyncState status="empty" emptyTitle="Nothing" emptyText="Come back later" />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(screen.getByText('Come back later')).toBeInTheDocument();
  });

  it('renders children on success', () => {
    render(<AsyncState status="success">content</AsyncState>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('focuses the cancel button and exposes dialog semantics', () => {
    render(<ConfirmDialog title="Sure?" message="Really" confirmLabel="Yes" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('alertdialog', { name: 'Sure?' })).toHaveAccessibleDescription('Really');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('confirms and cancels via buttons', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog title="t" message="m" confirmLabel="Yes" cancelLabel="No" onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onConfirm).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('cancels on Escape and on backdrop click, but not on dialog click', async () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog title="t" message="m" confirmLabel="Yes" onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('alertdialog'));
    expect(onCancel).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(container.querySelector('.overlay'));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});

describe('Header and Footer', () => {
  it('Header links to every page', () => {
    inRouter(<Header />);
    expect(screen.getByRole('link', { name: 'Quizzes' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it('Footer shows the current year', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(String(new Date().getFullYear()));
  });
});

describe('ProgressBar', () => {
  it('shows position and answered count', () => {
    render(<ProgressBar current={1} total={5} answered={2} />);
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('2 answered')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Quiz progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar.firstChild).toHaveStyle({ width: '40%' });
  });

  it('never shows a question number past the total', () => {
    render(<ProgressBar current={5} total={5} answered={5} />);
    expect(screen.getByText('Question 5 of 5')).toBeInTheDocument();
  });
});

describe('ProgressChart', () => {
  const attempts = [makeCompleted({ attemptId: 'a', percentage: 40 }), makeCompleted({ attemptId: 'b', percentage: 80 })];

  it('describes the trend for assistive tech and draws a line and dots', () => {
    const { container } = render(<ProgressChart attempts={attempts} title="Demo" />);
    expect(screen.getByRole('img', { name: /Score trend for Demo\. attempt 1: 40%, attempt 2: 80%/ })).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('polyline')).not.toBeNull();
  });

  it('omits the line for a single attempt', () => {
    const { container } = render(<ProgressChart attempts={attempts.slice(0, 1)} title="Demo" />);
    expect(container.querySelector('polyline')).toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});

describe('QuestionCard', () => {
  const question = makeQuiz().questions[0];
  const setup = (props = {}) => {
    const handlers = { onAnswer: vi.fn(), onNext: vi.fn() };
    render(<QuestionCard question={question} selectedOptionId={undefined} isLast={false} {...handlers} {...props} />);
    return handlers;
  };

  it('renders prompt and options, with Next disabled until answered', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Prompt 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Right 1|Wrong 1/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Next question' })).toBeDisabled();
    expect(screen.getByText('Select an answer to continue')).toBeInTheDocument();
  });

  it('can be answered with the keyboard', async () => {
    const { onAnswer } = setup();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Right 1/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onAnswer).toHaveBeenCalledWith('q1', 'a');
  });

  it('shows a correct result with text, not only colour', () => {
    setup({ selectedOptionId: 'a' });
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct answer')).toBeInTheDocument();
    expect(screen.getByText('Because 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next question' })).toBeEnabled();
  });

  it('shows an incorrect result and marks the right answer', () => {
    setup({ selectedOptionId: 'b' });
    expect(screen.getByText('✗ Incorrect.')).toBeInTheDocument();
    expect(screen.getByText('✗ Your answer')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct answer')).toBeInTheDocument();
  });

  it('locks options once answered', () => {
    setup({ selectedOptionId: 'a' });
    screen.getAllByRole('button', { name: /Right 1|Wrong 1/ }).forEach((b) => expect(b).toBeDisabled());
  });

  it('labels the last question "Finish quiz" and calls onNext', async () => {
    const { onNext } = setup({ selectedOptionId: 'a', isLast: true });
    await userEvent.click(screen.getByRole('button', { name: 'Finish quiz' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe('QuizCard', () => {
  const summary = { id: 'test-quiz', title: 'Test Quiz', description: 'Desc', difficulty: 'beginner', questionCount: 5 };

  it('shows a start link by default', () => {
    inRouter(<QuizCard quiz={summary} />);
    const link = screen.getByRole('link', { name: 'Start quiz: Test Quiz' });
    expect(link).toHaveAttribute('href', '/quiz/test-quiz');
    expect(screen.getByText('5 questions')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('offers resume with progress for an in-progress attempt', () => {
    const quiz = makeQuiz();
    saveActiveAttempt(makeActive(quiz, { currentIndex: 2, answers: { q1: 'a', q2: 'a' } }));
    inRouter(<QuizCard quiz={summary} />);
    expect(screen.getByRole('link', { name: 'Resume quiz: Test Quiz' })).toBeInTheDocument();
    expect(screen.getByText('In progress: 2 of 5 answered')).toBeInTheDocument();
  });

  it('offers to view the result for a finished attempt', () => {
    saveActiveAttempt(makeActive(makeQuiz(), { currentIndex: 5 }));
    inRouter(<QuizCard quiz={summary} />);
    expect(screen.getByRole('link', { name: 'View result: Test Quiz' })).toBeInTheDocument();
  });
});

describe('QuizResult', () => {
  const quiz = makeQuiz();
  const setup = (answers, historyStatus = 'saved', handlers = {}) => {
    const total = quiz.questions.length;
    const score = quiz.questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    const result = { score, total, percentage: Math.round((score / total) * 100) };
    inRouter(
      <QuizResult quiz={quiz} attempt={{ answers }} result={result} historyStatus={historyStatus} onRetake={() => {}} onRetrySave={() => {}} {...handlers} />,
    );
  };

  it('shows score, percentage and saved status', () => {
    setup({ q1: 'a', q2: 'a', q3: 'b', q4: 'a', q5: 'b' });
    expect(screen.getByText(/3 \/ 5 correct/)).toBeInTheDocument();
    expect(screen.getByText('(60%)')).toBeInTheDocument();
    expect(screen.getByText(/Result saved/)).toBeInTheDocument();
  });

  it('reviews missed questions with singular/plural wording', () => {
    setup({ q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'b' });
    expect(screen.getByText('You missed 1 question:')).toBeInTheDocument();
    expect(screen.getByText(/Question 5: Prompt 5/)).toBeInTheDocument();
    expect(screen.getByText('Wrong 5', { exact: false })).toBeInTheDocument();
  });

  it('shows "No answer" for unanswered questions', () => {
    setup({ q1: 'a', q2: 'a', q3: 'a', q4: 'a' });
    expect(screen.getByText('No answer', { exact: false })).toBeInTheDocument();
  });

  it('congratulates a perfect score', () => {
    setup({ q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a' });
    expect(screen.getByText('Perfect score!')).toBeInTheDocument();
    expect(screen.getByText(/nothing to review/)).toBeInTheDocument();
  });

  it('offers retry when saving failed', async () => {
    const onRetrySave = vi.fn();
    setup({}, 'failed', { onRetrySave });
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    await userEvent.click(screen.getByRole('button', { name: 'Try saving again' }));
    expect(onRetrySave).toHaveBeenCalled();
  });

  it('retake and navigation actions work', async () => {
    const onRetake = vi.fn();
    setup({}, 'saved', { onRetake });
    await userEvent.click(screen.getByRole('button', { name: 'Retake quiz' }));
    expect(onRetake).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'View progress' })).toHaveAttribute('href', '/progress');
  });
});
