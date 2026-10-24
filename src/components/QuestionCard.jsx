import Button from './Button';

const LETTERS = 'ABCDEFGHIJ';

export default function QuestionCard({ question, selectedOptionId, onAnswer, onNext, isLast }) {
  const answered = selectedOptionId !== undefined;
  const isCorrect = answered && selectedOptionId === question.correctOptionId;

  return (
    <section className="card question" aria-labelledby="question-prompt">
      <h3 id="question-prompt">{question.prompt}</h3>

      <ul className="options">
        {question.options.map((option, i) => {
          const chosen = option.id === selectedOptionId;
          const correct = option.id === question.correctOptionId;
          let cls = 'option';
          let tag = null;
          if (answered && correct) {
            cls += ' option-correct';
            tag = '✓ Correct answer';
          } else if (answered && chosen) {
            cls += ' option-wrong';
            tag = '✗ Your answer';
          }
          return (
            <li key={option.id}>
              <button
                type="button"
                className={cls}
                disabled={answered}
                aria-pressed={chosen}
                onClick={() => onAnswer(question.id, option.id)}
              >
                <span className="option-letter">{LETTERS[i]}</span>
                <span className="option-text">{option.text}</span>
                {tag && <span className="option-tag">{tag}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {answered && (
          <div className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{isCorrect ? '✓ Correct!' : '✗ Incorrect.'}</strong>
            <p>{question.explanation}</p>
          </div>
        )}
      </div>

      <div className="question-actions">
        <Button onClick={onNext} disabled={!answered}>
          {isLast ? 'Finish quiz' : 'Next question'}
        </Button>
        {!answered && <span className="hint">Select an answer to continue</span>}
      </div>
    </section>
  );
}
