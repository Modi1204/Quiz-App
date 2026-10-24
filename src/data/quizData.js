// Mock database. Bump DATA_VERSION whenever question content changes so that
// saved attempts made against older content can be detected and discarded.
export const DATA_VERSION = 1;

export const categories = [
  { id: 'agent-design', name: 'Agent Design', description: 'Architecture, tools, memory and planning for AI agents.', icon: '🤖' },
  { id: 'prompt-engineering', name: 'Prompt Engineering', description: 'Writing clear, reliable and testable prompts.', icon: '✍️' },
  { id: 'workflow-automation', name: 'Workflow Automation', description: 'Orchestrating AI steps, retries and human review.', icon: '⚙️' },
  { id: 'ai-coding-tools', name: 'AI Coding Tools', description: 'Working effectively with AI coding assistants.', icon: '💻' },
];

export const quizzes = [
  {
    id: 'agent-fundamentals',
    categoryId: 'agent-design',
    title: 'Agent Fundamentals',
    description: 'Core building blocks of an AI agent: loop, tools, memory and guardrails.',
    difficulty: 'beginner',
    questions: [
      {
        id: 'af-1',
        prompt: 'What best describes an AI agent?',
        options: [
          { id: 'a', text: 'A model that only answers a single prompt with no tools' },
          { id: 'b', text: 'A system that uses a model to decide actions, call tools and iterate toward a goal' },
          { id: 'c', text: 'A database that stores prompts' },
          { id: 'd', text: 'A UI component library for chat' },
        ],
        correctOptionId: 'b',
        explanation: 'Agents run a loop: observe, decide, act with tools, and repeat until the goal is met or a stop condition is reached.',
      },
      {
        id: 'af-2',
        prompt: 'Why do agents need tools?',
        options: [
          { id: 'a', text: 'To let the model act on and read from the outside world' },
          { id: 'b', text: 'To make the model larger' },
          { id: 'c', text: 'To remove the need for prompts' },
          { id: 'd', text: 'To reduce token usage to zero' },
        ],
        correctOptionId: 'a',
        explanation: 'Tools (search, code execution, APIs) give the model capabilities and fresh data it does not have internally.',
      },
      {
        id: 'af-3',
        prompt: 'Which is an example of short-term agent memory?',
        options: [
          { id: 'a', text: 'A vector database of past projects' },
          { id: 'b', text: 'Fine-tuned model weights' },
          { id: 'c', text: 'The conversation and tool results in the current context window' },
          { id: 'd', text: 'A nightly backup file' },
        ],
        correctOptionId: 'c',
        explanation: 'Short-term memory is what is currently in context; long-term memory is persisted externally and retrieved when needed.',
      },
      {
        id: 'af-4',
        prompt: 'What is the main purpose of a stop condition or step limit in an agent loop?',
        options: [
          { id: 'a', text: 'To make responses shorter' },
          { id: 'b', text: 'To prevent infinite loops and runaway cost' },
          { id: 'c', text: 'To hide tool calls from users' },
          { id: 'd', text: 'To improve image quality' },
        ],
        correctOptionId: 'b',
        explanation: 'Without bounds, an agent can loop forever or burn tokens and API calls. Limits keep behaviour predictable.',
      },
      {
        id: 'af-5',
        prompt: 'Which guardrail is most appropriate before an agent deletes production data?',
        options: [
          { id: 'a', text: 'Let the agent proceed automatically' },
          { id: 'b', text: 'Increase the temperature' },
          { id: 'c', text: 'Shorten the system prompt' },
          { id: 'd', text: 'Require explicit human approval' },
        ],
        correctOptionId: 'd',
        explanation: 'Destructive or irreversible actions should require human-in-the-loop confirmation.',
      },
    ],
  },
  {
    id: 'prompt-basics',
    categoryId: 'prompt-engineering',
    title: 'Prompt Engineering Basics',
    description: 'Techniques for clear instructions, examples and structured output.',
    difficulty: 'beginner',
    questions: [
      {
        id: 'pe-1',
        prompt: 'Which prompt is most likely to give a useful result?',
        options: [
          { id: 'a', text: '"Write code."' },
          { id: 'b', text: '"Do the thing from before."' },
          { id: 'c', text: '"Write a Python function that validates an email, with 3 unit tests."' },
          { id: 'd', text: '"Make it good."' },
        ],
        correctOptionId: 'c',
        explanation: 'Specific language, task and acceptance criteria reduce ambiguity.',
      },
      {
        id: 'pe-2',
        prompt: 'What is few-shot prompting?',
        options: [
          { id: 'a', text: 'Including a few worked examples in the prompt' },
          { id: 'b', text: 'Sending the prompt several times quickly' },
          { id: 'c', text: 'Limiting the model to a few tokens' },
          { id: 'd', text: 'Training the model on a few GPUs' },
        ],
        correctOptionId: 'a',
        explanation: 'Examples demonstrate the desired format and behaviour without any training.',
      },
      {
        id: 'pe-3',
        prompt: 'What does the system prompt typically define?',
        options: [
          { id: 'a', text: 'The GPU used for inference' },
          { id: 'b', text: 'The model role, rules and tone for the whole conversation' },
          { id: 'c', text: 'The user’s password' },
          { id: 'd', text: 'The model’s training data' },
        ],
        correctOptionId: 'b',
        explanation: 'System prompts set persistent behaviour and constraints that apply across turns.',
      },
      {
        id: 'pe-4',
        prompt: 'How can you make model output easy for code to consume?',
        options: [
          { id: 'a', text: 'Ask for a poem' },
          { id: 'b', text: 'Use a very high temperature' },
          { id: 'c', text: 'Ask for a long essay' },
          { id: 'd', text: 'Request a strict JSON schema and validate the result' },
        ],
        correctOptionId: 'd',
        explanation: 'Structured output plus validation lets programs rely on the response and retry on failure.',
      },
      {
        id: 'pe-5',
        prompt: 'What is prompt injection?',
        options: [
          { id: 'a', text: 'Untrusted input that tries to override the intended instructions' },
          { id: 'b', text: 'A faster way to load prompts' },
          { id: 'c', text: 'A compression technique' },
          { id: 'd', text: 'A type of fine-tuning' },
        ],
        correctOptionId: 'a',
        explanation: 'Treat user and retrieved content as untrusted data, and limit what the model is allowed to do with it.',
      },
    ],
  },
  {
    id: 'workflow-essentials',
    categoryId: 'workflow-automation',
    title: 'Workflow Automation Essentials',
    description: 'Chaining, retries, evaluation and human review in AI pipelines.',
    difficulty: 'intermediate',
    questions: [
      {
        id: 'wa-1',
        prompt: 'Why break a complex task into a multi-step workflow?',
        options: [
          { id: 'a', text: 'Each step is simpler, testable and easier to debug' },
          { id: 'b', text: 'It guarantees zero errors' },
          { id: 'c', text: 'It removes the need for evaluation' },
          { id: 'd', text: 'It makes the model faster by default' },
        ],
        correctOptionId: 'a',
        explanation: 'Smaller steps with clear inputs and outputs improve reliability and observability.',
      },
      {
        id: 'wa-2',
        prompt: 'Which is a good way to handle a transient API failure?',
        options: [
          { id: 'a', text: 'Ignore it and continue' },
          { id: 'b', text: 'Retry with exponential backoff and a maximum attempt count' },
          { id: 'c', text: 'Retry instantly forever' },
          { id: 'd', text: 'Delete the workflow' },
        ],
        correctOptionId: 'b',
        explanation: 'Backoff avoids hammering the service, and a cap prevents endless retries.',
      },
      {
        id: 'wa-3',
        prompt: 'What does an idempotent step guarantee?',
        options: [
          { id: 'a', text: 'It runs only once per year' },
          { id: 'b', text: 'It always returns random output' },
          { id: 'c', text: 'Running it repeatedly has the same effect as running it once' },
          { id: 'd', text: 'It cannot fail' },
        ],
        correctOptionId: 'c',
        explanation: 'Idempotency makes retries safe, for example avoiding duplicate charges or duplicate records.',
      },
      {
        id: 'wa-4',
        prompt: 'Why add automated evaluations (evals) to an AI workflow?',
        options: [
          { id: 'a', text: 'To replace all monitoring' },
          { id: 'b', text: 'To hide failures' },
          { id: 'c', text: 'To increase model size' },
          { id: 'd', text: 'To detect quality regressions when prompts or models change' },
        ],
        correctOptionId: 'd',
        explanation: 'Evals give repeatable measurements so changes can be compared objectively.',
      },
      {
        id: 'wa-5',
        prompt: 'When is human-in-the-loop review most valuable?',
        options: [
          { id: 'a', text: 'For high-risk or low-confidence decisions' },
          { id: 'b', text: 'Only for trivial formatting' },
          { id: 'c', text: 'Never, if automation exists' },
          { id: 'd', text: 'Only after deployment is deleted' },
        ],
        correctOptionId: 'a',
        explanation: 'Route risky or uncertain outputs to a person while automating the routine cases.',
      },
    ],
  },
  {
    id: 'ai-assisted-coding',
    categoryId: 'ai-coding-tools',
    title: 'AI-Assisted Coding',
    description: 'Get reliable results from AI coding assistants and review them well.',
    difficulty: 'intermediate',
    questions: [
      {
        id: 'ac-1',
        prompt: 'What should you do with AI-generated code before merging it?',
        options: [
          { id: 'a', text: 'Merge immediately' },
          { id: 'b', text: 'Review it and run tests' },
          { id: 'c', text: 'Remove all comments' },
          { id: 'd', text: 'Rewrite it in another language' },
        ],
        correctOptionId: 'b',
        explanation: 'The developer remains accountable; review and tests catch subtle bugs and hallucinated APIs.',
      },
      {
        id: 'ac-2',
        prompt: 'What helps an assistant produce code that fits your project?',
        options: [
          { id: 'a', text: 'Giving no context' },
          { id: 'b', text: 'Pasting unrelated files' },
          { id: 'c', text: 'Providing relevant files, conventions and constraints' },
          { id: 'd', text: 'Using only one-word prompts' },
        ],
        correctOptionId: 'c',
        explanation: 'Good context such as project rules and relevant code makes output consistent with your codebase.',
      },
      {
        id: 'ac-3',
        prompt: 'What is a “hallucinated” API in generated code?',
        options: [
          { id: 'a', text: 'An API that is very fast' },
          { id: 'b', text: 'An API protected by a firewall' },
          { id: 'c', text: 'An API with great documentation' },
          { id: 'd', text: 'A function or library that does not actually exist' },
        ],
        correctOptionId: 'd',
        explanation: 'Models can invent plausible-looking calls, so verify against official documentation and by running the code.',
      },
      {
        id: 'ac-4',
        prompt: 'Which workflow gives the best control over a large change?',
        options: [
          { id: 'a', text: 'Ask for the whole app in one prompt' },
          { id: 'b', text: 'Plan first, then make small, verifiable steps' },
          { id: 'c', text: 'Never use version control' },
          { id: 'd', text: 'Accept all suggestions without reading' },
        ],
        correctOptionId: 'b',
        explanation: 'Small iterations are easier to review, test and revert.',
      },
      {
        id: 'ac-5',
        prompt: 'What should never be pasted into an AI tool without approval?',
        options: [
          { id: 'a', text: 'Secrets, credentials and sensitive customer data' },
          { id: 'b', text: 'A public README' },
          { id: 'c', text: 'Open-source license text' },
          { id: 'd', text: 'A failing test name' },
        ],
        correctOptionId: 'a',
        explanation: 'Protect secrets and personal data; follow your organisation’s data-handling policy.',
      },
    ],
  },
];
