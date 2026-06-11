import type { Session, Topic, Example, TranscriptItem, Slide } from './db';

// Simple API client configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface AIResult {
  summary: string;
  keyPoints: string[];
  topics: Topic[];
  examples: Example[];
  slides: Slide[];
}

// ---------------------------------------------------------
// LOCAL PRESET SCHEMAS FOR HIGH-FIDELITY CLASS SIMULATION
// ---------------------------------------------------------

const PRESETS: Record<string, { subject: string, topics: Topic[], keyPoints: string[], summary: string, examples: Example[], speakers: string[], transcriptTemplates: string[], slides: Omit<Slide, 'id'>[] }> = {
  react: {
    subject: 'Web Development',
    summary: 'This session covers React State Management and Side Effects. The instructor starts by explaining the Virtual DOM and why React re-renders components. We then deep-dive into useState, lifecycle phases, and how useEffect handles cleanups and dependencies. Finally, custom Hooks are demonstrated to showcase how stateful logic can be extracted and reused across multiple components.',
    keyPoints: [
      'React uses a Virtual DOM to compute changes efficiently before updating the real browser DOM.',
      'State represents local mutable data that triggers a component re-render upon mutation.',
      'The useState Hook returns a stateful value and a dispatch function to update it.',
      'The useEffect Hook allows performing side effects like data fetching, subscriptions, or DOM mutations in functional components.',
      'The dependency array in useEffect determines when the effect runs; an empty array [] runs it once on mount.',
      'Custom Hooks are JavaScript functions starting with "use" that can call other Hooks, enabling code reuse.'
    ],
    topics: [
      { time: '00:00', title: 'Introduction to React State & V-DOM', description: 'Brief introduction to component re-renders and the role of the Virtual DOM in UI reconciliation.' },
      { time: '05:30', title: 'Mastering the useState Hook', description: 'Syntax, state updates, lazy initialization, and managing complex object states.' },
      { time: '12:15', title: 'Side Effects and the useEffect Lifecycle', description: 'Understanding lifecycle synchronization, side effects, and api integrations.' },
      { time: '20:45', title: 'Handling Effect Cleanups', description: 'Clearing timers, event listeners, and cancelling fetch requests to prevent memory leaks.' },
      { time: '27:00', title: 'Writing Custom Reuse Hooks', description: 'Extracting fetch and screen size listener logic into custom hooks.' }
    ],
    examples: [
      {
        topic: 'Mastering the useState Hook',
        concept: 'Counter Component with state',
        codeOrText: `import React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(prev => prev + 1)}>\n      Count: {count}\n    </button>\n  );\n}`
      },
      {
        topic: 'Handling Effect Cleanups',
        concept: 'Resize listener with cleanup',
        codeOrText: `useEffect(() => {\n  const handleResize = () => setWidth(window.innerWidth);\n  window.addEventListener('resize', handleResize);\n  \n  // Cleanup function\n  return () => {\n    window.removeEventListener('resize', handleResize);\n  };\n}, []);`
      }
    ],
    speakers: ['Dr. Sarah Jenkins', 'Student Alex', 'Student Marcus'],
    transcriptTemplates: [
      "Welcome back everyone. Today we are exploring state and side effects in React.",
      "Can anyone tell me why React doesn't update the entire page when state changes?",
      "Is it because of the Virtual DOM, Sarah? It only finds what changed and updates that?",
      "Exactly, Alex. React diffs the Virtual DOM tree and applies the minimal set of edits to the real DOM.",
      "Now, let's look at useState. It takes an initial value and returns a pair: the current state and a function to update it.",
      "What happens if I write count++ instead of setCount?",
      "React won't know the state changed because you bypassed the setter, so the component won't re-render.",
      "Spot on, Marcus! You must treat state as immutable.",
      "Let's move on to useEffect. This is where we run side effects like API requests or event subscriptions.",
      "Remember, if you omit the dependency array, the effect runs on *every single render*. That can cause infinite loops!",
      "If you pass an empty array, it runs once after the initial render. Like componentDidMount in class components.",
      "And what about cleanup? If we subscribe to window resize, we must return a cleanup function to remove the listener.",
      "Otherwise, we create memory leaks. The cleanup runs before the effect runs again, and on unmount.",
      "Let's write a custom hook called useWindowWidth to encapsulate this exact logic.",
      "And that wraps up our React Hooks session. Try the exercise on GitHub. See you next week!"
    ],
    slides: [
      { slideNumber: 1, title: 'React Hooks & State Management', type: 'title', content: ['An in-depth look at functional components', 'Mastering useState and useEffect Hooks', 'Instructor: Dr. Sarah Jenkins'] },
      { slideNumber: 2, title: 'The Virtual DOM & Reconciliation', type: 'content', content: ['React maintains an in-memory representation of the UI.', 'Changes are diffed against the previous tree.', 'Only the differences are flushed to the real DOM.', 'This keeps DOM operations minimal and performant.'] },
      { slideNumber: 3, title: 'useState Hook Syntax', type: 'code', content: ['Declares state variables in functional components.', 'Returns current state and updater function.', 'State updates trigger component re-render.', 'State must be treated as immutable.'], codeBlock: 'const [state, setState] = useState(initialState);\n\n// Update state:\nsetState(newValue);\n// Or functional update:\nsetState(prev => prev + 1);' },
      { slideNumber: 4, title: 'useEffect Hook & Lifecycle', type: 'content', content: ['Designed for side effects (API calls, subscriptions, timers).', 'Runs after layout paint is completed.', 'Omitting dependencies: runs after every render.', 'Empty array []: runs on mount only.'] },
      { slideNumber: 5, title: 'Preventing Memory Leaks with Cleanups', type: 'code', content: ['Effects can return a cleanup function.', 'Cleanup runs on component unmount.', 'Also runs before re-running the effect due to dependency changes.', 'Essential for removing listeners and clearing intervals.'], codeBlock: 'useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, [dependency]);' },
      { slideNumber: 6, title: 'Summary: Best Practices', type: 'summary', content: ['Always call hooks at the top level of your function.', 'Only call hooks from React function components or custom hooks.', 'Keep dependency arrays accurate to prevent stale state bugs.', 'Extract reusable stateful logic into custom hooks.'] }
    ]
  },
  ai: {
    subject: 'Computer Science',
    summary: 'This lecture introduces Artificial Intelligence and Deep Learning. The instructor traces the history of AI from symbolic logic to modern neural networks. We explore the structural design of Artificial Neural Networks (ANNs), focusing on neurons, weights, biases, and activation functions. Backpropagation and gradient descent are explained as the core optimization algorithms used to train networks by minimizing loss functions.',
    keyPoints: [
      'Artificial Neural Networks are inspired by biological brain structures, composed of layered nodes (neurons).',
      'Weights and biases are learnable parameters adjusted to minimize error in predictions.',
      'Activation functions (like ReLU, Sigmoid, and Tanh) introduce non-linearity, enabling networks to learn complex non-linear patterns.',
      'Loss functions measure the mathematical difference between network predictions and actual target values.',
      'Backpropagation calculates the gradients of the loss function with respect to weights using the chain rule.',
      'Gradient Descent updates network weights in the opposite direction of the gradients to iteratively reduce loss.'
    ],
    topics: [
      { time: '00:00', title: 'Evolution of Artificial Intelligence', description: 'Brief historical journey from rule-based symbolic AI to statistical machine learning.' },
      { time: '04:15', title: 'Neural Network Architecture', description: 'Structure of neurons, inputs, hidden layers, and output mappings.' },
      { time: '09:45', title: 'Activation Functions: Why Non-Linearity Matters', description: 'Comparing ReLU, Sigmoid, and Tanh activation characteristics.' },
      { time: '16:00', title: 'Loss Minimization & Gradient Descent', description: 'Mathematical definition of cost functions and updating parameters.' },
      { time: '23:30', title: 'Backpropagation and the Chain Rule', description: 'Calculating error contributions recursively backward through layers.' }
    ],
    examples: [
      {
        topic: 'Neural Network Architecture',
        concept: 'Simple mathematical representation of a single neuron',
        codeOrText: `y = f(w1*x1 + w2*x2 + ... + wn*xn + b)\n\nWhere:\n- x is the input vector\n- w represents the weights\n- b is the bias\n- f is the activation function (e.g. ReLU)\n- y is the output`
      },
      {
        topic: 'Loss Minimization & Gradient Descent',
        concept: 'Weight update formula',
        codeOrText: `W_new = W_old - (learning_rate * dLoss/dW)\n\nWhere dLoss/dW is the gradient of the loss function with respect to weight W.`
      }
    ],
    speakers: ['Prof. Alan Turing', 'Student Lisa', 'Student Dan'],
    transcriptTemplates: [
      "Hello class. Today we deep dive into the engine of modern AI: Deep Learning.",
      "We begin with the basic building block, the Artificial Neuron or Perceptron.",
      "How does a neuron decide to fire, Lisa?",
      "It sums its inputs multiplied by weights, adds a bias, and runs it through an activation function, Prof.",
      "Precisely. The weights represent the strength of connections, and bias is the threshold.",
      "Why do we need activation functions? Why not just sum them up?",
      "If we don't have activation functions, the whole network is just a linear equation, Dan. No matter how many layers, it remains linear.",
      "Excellent, Lisa. We need non-linear activations, like ReLU, which is max(0, x), to learn non-linear patterns.",
      "Now, how does the network learn? It predicts, checks the error, and adjusts weights.",
      "We use a Loss Function, like Mean Squared Error, to calculate how wrong our model is.",
      "Then we use Gradient Descent to step down the error slope and find the minimum loss.",
      "How do we know how much to adjust a weight in layer 1 if the error is measured at the output layer 5?",
      "We use Backpropagation. It calculates the error gradient layer by layer backwards using the mathematical chain rule.",
      "The learning rate determines how big our steps are. Too small, and training takes forever. Too large, and we overshoot.",
      "Next class, we will write a neural network from scratch in Python. Read the notes. Goodbye!"
    ],
    slides: [
      { slideNumber: 1, title: 'Introduction to Deep Learning', type: 'title', content: ['Foundations of neural network computing', 'Understanding Weights, Biases & Activations', 'Instructor: Prof. Alan Turing'] },
      { slideNumber: 2, title: 'Structure of an Artificial Neuron', type: 'visual', content: ['Inputs (x) are multiplied by weights (w).', 'Weighted inputs are summed, adding bias (b).', 'Sum passes through activation function (f).', 'Produces output (y) for next layer.'] },
      { slideNumber: 3, title: 'Activation Functions', type: 'code', content: ['Introduce non-linearity to the network.', 'Without them, multi-layer ANNs collapse to single linear models.', 'Sigmoid: maps inputs between 0 and 1.', 'ReLU (Rectified Linear Unit): max(0, x), avoids vanishing gradients.'], codeBlock: '# ReLU Activation in Python\ndef relu(x):\n    return max(0, x)\n\n# Sigmoid Activation\ndef sigmoid(x):\n    return 1 / (1 + math.exp(-x))' },
      { slideNumber: 4, title: 'Training Cycle: Loss & Gradients', type: 'content', content: ['1. Forward Pass: Compute predictions.', '2. Loss Calculation: Compare output against ground truth.', '3. Backward Pass (Backprop): Propagate error backwards.', '4. Weight Updates: Adjust parameters using Gradient Descent.'] },
      { slideNumber: 5, title: 'Gradient Descent Optimization', type: 'code', content: ['Iteratively minimizes the loss function.', 'Takes steps proportional to the negative gradient.', 'Learning rate (alpha) controls step size.', 'Local minima and saddle points are key challenges.'], codeBlock: '# Gradient descent update\nweight = weight - learning_rate * gradient' },
      { slideNumber: 6, title: 'Summary & Key Concepts', type: 'summary', content: ['Deep learning thrives on multiple stacked non-linear layers.', 'Weights represent information storage.', 'Backpropagation is the calculus engine of learning.', 'Next lecture: Convolutional Neural Networks (CNNs) for vision.'] }
    ]
  }
};

// Generates a general fallback preset based on title/subject
function generateDynamicPreset(title: string, subject: string): typeof PRESETS.react {
  const topics: Topic[] = [
    { time: '00:00', title: `Introduction to ${title}`, description: `Overview of foundational concepts and context regarding ${subject}.` },
    { time: '07:30', title: 'Core Mechanics & Principles', description: `Key architectural elements and structural details.` },
    { time: '15:45', title: 'Practical Examples & Syntax', description: 'Step-by-step code demonstrations and operational guidelines.' },
    { time: '22:15', title: 'Common Mistakes & Troubleshooting', description: 'Addressing frequent errors, edge cases, and optimization advice.' },
    { time: '28:00', title: 'Conclusion & Next Steps', description: 'Wrap-up, summary, and action items for revision.' }
  ];

  const keyPoints = [
    `Understanding the foundational boundaries of ${title} within ${subject}.`,
    `Mastering the syntax and core protocols for production environments.`,
    'Optimizing workflows by reducing overhead and avoiding common bottlenecks.',
    'Implementing clean, modular architecture for better long-term maintenance.',
    'Using automated checks and verification loops to validate performance.'
  ];

  const examples: Example[] = [
    {
      topic: 'Core Mechanics & Principles',
      concept: `Configuring ${title}`,
      codeOrText: `// System Configuration for ${title}\nconst config = {\n  mode: 'production',\n  target: '${subject.toLowerCase().replace(/ /g, '-')}',\n  enabled: true,\n  timeout: 5000\n};\nconsole.log("${title} system initialized successfully.");`
    }
  ];

  const speakers = ['Instructor Davies', 'Student Kim', 'Student Raj'];
  const transcriptTemplates = [
    `Welcome class. Today we will focus on ${title}, a critical topic in our ${subject} course.`,
    `Let's start by looking at the general structure. Why do you think this is important, Kim?`,
    `I think it helps structure the application flow and ensures modularity, Instructor.`,
    `Exactly, Kim. Modularity is key. Raj, what is your experience with this?`,
    `I struggled with debugging it at first, but setting up config files made it much simpler.`,
    `Yes, configuration separation is a best practice. Let's look at the config example.`,
    `Notice how we declare the target and mode parameters. This ensures flexibility.`,
    `What happens if we disable the timeout limit?`,
    `The request could hang indefinitely, blocking resources, Raj.`,
    `Precisely, Raj. Always set boundaries. Now, let's examine optimization techniques.`,
    `By caching results and memoizing functions, we can double execution speeds.`,
    `Remember, early optimization can lead to bloated code, so measure before refactoring.`,
    `We will cover deployment pipelines in our next session. Please review the slides.`,
    `Thank you everyone, class dismissed. Have a great day!`
  ];

  const slides: Omit<Slide, 'id'>[] = [
    { slideNumber: 1, title: `${title} Masterclass`, type: 'title', content: [`Exploring intermediate concepts in ${subject}`, `Best practices, design patterns, and debugging`, `Instructor: Instructor Davies`] },
    { slideNumber: 2, title: `Core Pillars of ${title}`, type: 'content', content: ['Establishes structured logic layers.', 'Promotes strict separation of concerns.', 'Enables parallel work streams across developers.', 'Reduces integration debt during deployments.'] },
    { slideNumber: 3, title: 'Code Implementation', type: 'code', content: ['Declares structural configurations.', 'Ensures fail-safes are declared explicitly.', 'Validates inputs before entering operational loops.'], codeBlock: `// Initialization Routine\nfunction initializeSystem(options) {\n  const target = options.target || '${subject}';\n  console.log('Target system initialized: ' + target);\n  return true;\n}` },
    { slideNumber: 4, title: 'Operational Guidelines', type: 'content', content: ['1. Standardize component declarations.', '2. Decouple environment variables from codebase.', '3. Write comprehensive unit tests for core functions.', '4. Maintain clear API documentation borders.'] },
    { slideNumber: 5, title: 'Summary & Revision Tips', type: 'summary', content: [`Mastery of ${title} is crucial for scaling ${subject} applications.`, 'Focus on modularity, testing, and documentation.', 'Review the code templates in the study guide.', 'Prep questions for the next live Q&A session.'] }
  ];

  return {
    subject,
    summary: `This lecture provides a comprehensive walkthrough of ${title} within ${subject}. The instructor begins with theoretical setups and basic motivations, highlighting modular architectures. We then look at concrete code configurations and operational loops. Lastly, we evaluate performance trade-offs, debugging options, and deployment workflows.`,
    keyPoints,
    topics,
    examples,
    speakers,
    transcriptTemplates,
    slides
  };
}

// ---------------------------------------------------------
// EXPORTED FUNCTIONS
// ---------------------------------------------------------

/**
 * Analyzes a raw transcript text and returns structured session summary, topics, and slides.
 * Utilizes Gemini API if API key is provided, falls back on preset mock compiler otherwise.
 */
export async function generateSessionFromTranscript(
  title: string,
  subject: string,
  rawTranscriptText: string,
  apiKey?: string
): Promise<AIResult> {
  // If API Key is present, try hitting the real Gemini API
  if (apiKey && apiKey.trim() !== '') {
    try {
      const prompt = `
        You are an elite educational AI assistant. I will provide a lecture title, subject, and a raw transcript of an online class. 
        Your task is to analyze this transcript and generate a highly structured study guide and PowerPoint slide deck structure.
        
        INPUTS:
        Lecture Title: ${title}
        Subject: ${subject}
        Raw Transcript:
        ${rawTranscriptText}

        OUTPUT FORMAT:
        You must return a single, valid JSON object containing exactly the following keys. Do NOT include markdown styling (like \`\`\`json) in the response, output raw JSON.
        
        {
          "summary": "A detailed 3-4 sentence paragraph summarizing the main concepts taught in the lecture, the teaching flow, and final conclusions.",
          "keyPoints": [
            "A list of 5-6 key takeaways or definitions taught in the class.",
            "Each key point must be descriptive and educational."
          ],
          "topics": [
            {
              "time": "MM:SS timestamp format where this topic starts (e.g. 05:30)",
              "title": "A short, engaging title for the topic",
              "description": "A 1-sentence explanation of what was taught in this segment."
            }
          ],
          "examples": [
            {
              "topic": "The exact title of the topic this example belongs to",
              "concept": "Name of the concept/code snippet (e.g., useState toggle state)",
              "codeOrText": "The exact code block or formulas taught. Use \\n for line breaks."
            }
          ],
          "slides": [
            {
              "slideNumber": 1,
              "title": "Slide Title",
              "type": "title", 
              "content": ["Subtitle bullet 1", "Subtitle bullet 2"]
            },
            {
              "slideNumber": 2,
              "title": "Next Slide Title",
              "type": "content", 
              "content": ["Key educational bullet 1", "Key educational bullet 2", "Key educational bullet 3"]
            },
            {
              "slideNumber": 3,
              "title": "A Code Slide",
              "type": "code",
              "content": ["Bullets describing the code"],
              "codeBlock": "Actual programming code or equations",
              "notes": "Speaker notes for the instructor explaining this slide."
            },
            {
              "slideNumber": 4,
              "title": "A Visual Layout Slide",
              "type": "visual",
              "content": ["Bullet explanation of diagrams", "Visual elements to inspect"]
            },
            {
              "slideNumber": 5,
              "title": "Summary Slide",
              "type": "summary",
              "content": ["Closing bullet 1", "Closing bullet 2"]
            }
          ]
        }

        Slide Types are restricted to: 'title' | 'content' | 'visual' | 'code' | 'summary'.
        Keep the slides sequential, starting from slideNumber 1. The total slides should be between 5 and 8.
      `;

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        const parsed = JSON.parse(textResponse) as AIResult;
        // Map slides to append dummy IDs
        const slidesWithIds = parsed.slides.map((s, idx) => ({
          ...s,
          id: `slide_${Date.now()}_${idx}`
        }));
        return {
          ...parsed,
          slides: slidesWithIds
        };
      }
    } catch (err) {
      console.error('Failed call to Gemini API, running local fallback. Error details:', err);
    }
  }

  // Fallback / simulation offline logic
  // Match keyword in title
  const titleLower = title.toLowerCase();
  let selectedPreset = PRESETS.react;

  if (titleLower.includes('ai') || titleLower.includes('deep') || titleLower.includes('neural') || titleLower.includes('learn') || titleLower.includes('machine')) {
    selectedPreset = PRESETS.ai;
  } else if (titleLower.includes('react') || titleLower.includes('hook') || titleLower.includes('web') || titleLower.includes('js') || titleLower.includes('state')) {
    selectedPreset = PRESETS.react;
  } else {
    selectedPreset = generateDynamicPreset(title, subject);
  }

  // Create slides with complete ID fields
  const slides = selectedPreset.slides.map((slide, idx) => ({
    ...slide,
    id: `slide_${Date.now()}_${idx}`
  })) as Slide[];

  // artificial delay to simulate AI thought
  await new Promise(r => setTimeout(r, 1500));

  return {
    summary: selectedPreset.summary,
    keyPoints: selectedPreset.keyPoints,
    topics: selectedPreset.topics,
    examples: selectedPreset.examples,
    slides
  };
}

/**
 * Handles conversational queries about the class transcript.
 * Performs real Gemini calls if API key is provided, performs RAG-like local keyword mapping otherwise.
 */
export async function chatWithTranscript(
  session: Session,
  message: string,
  chatHistory: { role: 'user' | 'model'; parts: string }[],
  apiKey?: string
): Promise<string> {
  const query = message.toLowerCase().trim();

  // If API Key is present, call Gemini API
  if (apiKey && apiKey.trim() !== '') {
    try {
      const simplifiedTranscript = session.transcript.slice(0, 150).map(t => {
        const spk = session.speakers.find(s => s.id === t.speakerId)?.name || 'Speaker';
        return `[${Math.floor(t.time / 60)}:${Math.floor(t.time % 60)}] ${spk}: ${t.text}`;
      }).join('\n');

      const systemPrompt = `
        You are a helpful classroom AI teaching assistant. Your job is to answer questions specifically about a recorded lecture session.
        Use the following session details (Title, Subject, Summary, Slides, and Transcript snippets) to answer the student's question accurately.
        If the answer cannot be found or inferred from the lecture, answer based on general knowledge but state clearly that it was not explicitly mentioned in the transcript.
        
        LECTURE TITLE: ${session.title}
        SUBJECT: ${session.subject}
        LECTURE SUMMARY: ${session.summary}
        
        SLIDES SUMMARY:
        ${session.slides.map(s => `Slide ${s.slideNumber} [${s.title}]: ${s.content.join(', ')}`).join('\n')}

        TRANSCRIPT EXCERPT:
        ${simplifiedTranscript}
      `;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...chatHistory.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.parts }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        return textResponse;
      }
    } catch (err) {
      console.error('Failed chat call to Gemini API, running local response:', err);
    }
  }

  // ---------------------------------------------------------
  // LOCAL RAG CHAT SYSTEM (KEYWORD SCORING & TRANSCRIPT SEARCH)
  // ---------------------------------------------------------
  
  // Custom response logic based on common topics
  if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
    return `Hi there! I am your LecturaAI study companion. I have indexed the entire transcript, slide deck, and summary of this session. You can ask me questions like:
    \n• *What was the main topic?*
    \n• *Give me a summary of the slides.*
    \n• *Show me the code examples.*
    \n• *Explain a specific keyword (e.g. state, weights, dependencies).*`;
  }

  if (query.includes('summary') || query.includes('summarize') || query.includes('overview')) {
    return `Here is a summary of the session: \n\n**${session.title}** (${session.subject})\n\n${session.summary}\n\n*Key takeaways:* \n${session.keyPoints.map(kp => `• ${kp}`).join('\n')}`;
  }

  if (query.includes('slide') || query.includes('presentation') || query.includes('ppt')) {
    const slideSummary = session.slides.map(s => `**Slide ${s.slideNumber}: ${s.title}** (${s.type})\n${s.content.map(c => `  - ${c}`).join('\n')}`).join('\n\n');
    return `This session generated **${session.slides.length} slides**:\n\n${slideSummary}`;
  }

  if (query.includes('code') || query.includes('example') || query.includes('programming') || query.includes('syntax')) {
    if (session.examples.length === 0) {
      return `There are no specific code blocks generated for this lecture, but here is a sample structure related to ${session.title}:\n\n\`\`\`javascript\n// Sample configuration\nconst session = "${session.title}";\nconsole.log("Learning about " + session);\n\`\`\``;
    }
    const examplesStr = session.examples.map(ex => `### ${ex.concept}\n*Topic: ${ex.topic}*\n\`\`\`javascript\n${ex.codeOrText}\n\`\`\``).join('\n\n');
    return `Here are the code snippets and examples extracted from the session:\n\n${examplesStr}`;
  }

  if (query.includes('speaker') || query.includes('who spoke') || query.includes('talked')) {
    const speakerList = session.speakers.map(s => {
      const min = Math.floor(s.duration / 60);
      const sec = s.duration % 60;
      return `• **${s.name}**: spoke for ${min}m ${sec}s (${Math.round((s.duration / (session.duration || 1)) * 100)}% of the class)`;
    }).join('\n');
    return `Here is the speaker activity tracking breakdown for this session:\n\n${speakerList}`;
  }

  // Tokenize and scan transcript sentences
  const searchTerms = query.split(/\s+/).filter(word => word.length > 3);
  let bestMatches: { item: TranscriptItem; score: number }[] = [];

  session.transcript.forEach(item => {
    let score = 0;
    const itemTextLower = item.text.toLowerCase();
    
    searchTerms.forEach(term => {
      if (itemTextLower.includes(term)) {
        score += 1;
      }
    });

    if (score > 0) {
      bestMatches.push({ item, score });
    }
  });

  // Sort by score descending
  bestMatches.sort((a, b) => b.score - a.score);

  if (bestMatches.length > 0) {
    const quotes = bestMatches.slice(0, 3).map(match => {
      const spk = session.speakers.find(s => s.id === match.item.speakerId)?.name || 'Speaker';
      const m = Math.floor(match.item.time / 60);
      const s = Math.floor(match.item.time % 60);
      const timeStr = `[${m}:${s.toString().padStart(2, '0')}]`;
      return `> **${spk}** ${timeStr}: "${match.item.text}"`;
    }).join('\n\n');

    return `Based on my analysis of the session, here are some relevant quotes found in the transcript:\n\n${quotes}\n\nWould you like me to elaborate on any of these topics?`;
  }

  // General fallback
  return `I found that the lecture **"${session.title}"** focused on **${session.subject}**. The main topics discussed were:\n${session.topics.map((t, i) => `${i+1}. **${t.title}** (${t.time}) - *${t.description}*`).join('\n')}\n\nFeel free to ask a more specific question about these points or request slide summaries!`;
}

/**
 * Simulates extracting a transcript from an online class link and generating a session.
 * For demonstration purposes, it generates a mock transcript based on the provided title and then calls the main generation function.
 */
export async function generateSessionFromLink(
  url: string,
  title: string,
  subject: string,
  apiKey?: string
): Promise<Session> {
  // Simulate network delay for "downloading" and "extracting" transcript from video
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Generate a mock transcript snippet to pass to the AI
  const mockTranscript = `[0s] Instructor: Welcome to our online session. Today we are discussing ${title} within the context of ${subject}. Let's dive into the core concepts based on the link provided: ${url}.`;

  // Generate the structured result
  const aiResult = await generateSessionFromTranscript(title, subject, mockTranscript, apiKey);

  // Compile it into a complete Session object
  const newSession: Session = {
    id: `sess_link_${Date.now()}`,
    title,
    subject,
    createdAt: Date.now(),
    duration: 3600, // Simulated 1 hour session
    summary: aiResult.summary,
    keyPoints: aiResult.keyPoints,
    topics: aiResult.topics,
    examples: aiResult.examples,
    slides: aiResult.slides,
    speakers: [
      { id: 'spk_instructor', name: 'Instructor', color: '#3b82f6', duration: 3000 }
    ],
    transcript: [
      { id: 'tx_sim_1', speakerId: 'spk_instructor', time: 0, text: mockTranscript },
      { id: 'tx_sim_2', speakerId: 'spk_instructor', time: 600, text: "The first key point is understanding the foundational principles. Are there any questions from the chat?" },
      { id: 'tx_sim_3', speakerId: 'spk_instructor', time: 1800, text: "Let's move on to the practical application phase. We will look at some examples." },
      { id: 'tx_sim_4', speakerId: 'spk_instructor', time: 3500, text: "That concludes our session. Thank you for watching. The slides and summary will be available in your dashboard." }
    ],
    screenshots: []
  };

  return newSession;
}
