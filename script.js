/**
 * AI Quiz Generator - Core Application Script
 * Built using Vanilla JavaScript
 */

// 1. Application State
const state = {
  // Store keys for each provider separately
  apiKeys: {
    openai: '',
    gemini: '',
    anthropic: ''
  },
  selectedModel: '',
  topic: '',
  questions: [], // Loaded questions array
  currentIndex: 0,
  answers: [], // User answers (index or string)
  
  // Timer settings
  timerInterval: null,
  timeLeft: 30,
  
  // UI screens mapping
  screens: {
    home: document.getElementById('home-screen'),
    loading: document.getElementById('loading-screen'),
    error: document.getElementById('error-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
  }
};

// 2. DOM Elements
const configForm = document.getElementById('quiz-config-form');
const modelSelect = document.getElementById('model-select');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyLabel = document.getElementById('api-key-label');
const keySavedBadge = document.getElementById('key-saved-badge');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const topicInput = document.getElementById('topic-input');
const generateBtn = document.getElementById('generate-btn');

// Loading screen items
const loadingTitle = document.getElementById('loading-title');
const loadingStatus = document.getElementById('loading-status');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// Error screen items
const errorDescription = document.getElementById('error-description');
const errorRemedyTips = document.getElementById('error-remedy-tips');
const errorBackBtn = document.getElementById('error-back-btn');

// Quiz screen items
const quizTopicBadge = document.getElementById('quiz-topic-badge');
const quizModelBadge = document.getElementById('quiz-model-badge');
const progressQuestionNum = document.getElementById('progress-question-num');
const progressQuestionPercent = document.getElementById('progress-question-percent');
const quizProgressFill = document.getElementById('quiz-progress-fill');
const timerIndicator = document.getElementById('timer-indicator');
const timerCountdown = document.getElementById('timer-countdown');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');

// Result screen items
const resultPerformanceBadge = document.getElementById('result-performance-badge');
const resultTopicSubtitle = document.getElementById('result-topic-subtitle');
const resultModelSubtitle = document.getElementById('result-model-subtitle');
const resultScoreFraction = document.getElementById('result-score-fraction');
const resultPercent = document.getElementById('result-percent');
const resultFeedbackMessage = document.getElementById('result-feedback-message');
const statTotal = document.getElementById('stat-total');
const statCorrect = document.getElementById('stat-correct');
const statWrong = document.getElementById('stat-wrong');
const statUnanswered = document.getElementById('stat-unanswered');
const replayBtn = document.getElementById('replay-btn');
const newQuizBtn = document.getElementById('new-quiz-btn');

// 3. Initialize App & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  setupEventListeners();
});

// Load preferences from local storage
function loadFromLocalStorage() {
  // Load API Keys
  const savedKeys = localStorage.getItem('ai_quiz_api_keys');
  if (savedKeys) {
    try {
      state.apiKeys = JSON.parse(savedKeys);
    } catch (e) {
      console.error('Error parsing stored API keys', e);
    }
  }



  // Load Last Model Selection
  const savedModel = localStorage.getItem('ai_quiz_selected_model');
  if (savedModel) {
    state.selectedModel = savedModel;
    modelSelect.value = savedModel;
    updateApiKeyField(savedModel);
  } else {
    // Default selection
    modelSelect.selectedIndex = 0;
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Model Select Change
  modelSelect.addEventListener('change', (e) => {
    state.selectedModel = e.target.value;
    localStorage.setItem('ai_quiz_selected_model', state.selectedModel);
    updateApiKeyField(state.selectedModel);
  });

  // Password Visibility Toggle
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.innerHTML = isPassword ? 
      `<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>` :
      `<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
  });

  // Form Submit (Generate Quiz)
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateConfiguration()) {
      saveConfiguration();
      generateQuiz();
    }
  });



  // Error screen back button
  errorBackBtn.addEventListener('click', () => {
    switchScreen('home');
  });

  // Replay Quiz button
  replayBtn.addEventListener('click', () => {
    restartQuiz(true); // Restart with same questions
  });

  // New Quiz button
  newQuizBtn.addEventListener('click', () => {
    restartQuiz(false); // Go back to config
  });
}

// 4. Helper Functions
function getProviderByModel(model) {
  if (model.includes('gemini')) return 'gemini';
  if (model.includes('gpt')) return 'openai';
  if (model.includes('claude')) return 'anthropic';
  return '';
}

function updateApiKeyField(model) {
  const provider = getProviderByModel(model);
  
  // Update Label
  if (provider === 'gemini') {
    apiKeyLabel.textContent = 'Google Gemini API Key';
    apiKeyInput.placeholder = 'AIzaSy... (Gemini API Key)';
  } else if (provider === 'openai') {
    apiKeyLabel.textContent = 'OpenAI API Key';
    apiKeyInput.placeholder = 'sk-... (OpenAI API Key)';
  } else if (provider === 'anthropic') {
    apiKeyLabel.textContent = 'Anthropic Claude API Key';
    apiKeyInput.placeholder = 'sk-ant-... (Claude API Key)';
  } else {
    apiKeyLabel.textContent = 'API Key';
    apiKeyInput.placeholder = 'Enter API Key...';
  }

  // Load stored key if it exists
  const key = state.apiKeys[provider] || '';
  apiKeyInput.value = key;

  // Toggle Saved Badge
  if (key) {
    keySavedBadge.classList.add('visible');
  } else {
    keySavedBadge.classList.remove('visible');
  }
}

// Switch between screens with animation triggers
function switchScreen(screenName) {
  Object.keys(state.screens).forEach(key => {
    if (key === screenName) {
      state.screens[key].classList.add('active');
    } else {
      state.screens[key].classList.remove('active');
    }
  });
}

// Form validation
function validateConfiguration() {
  let isValid = true;

  // Clear previous inline errors if any
  document.querySelectorAll('.input-error-msg').forEach(el => el.remove());
  document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));

  // 1. Model select
  if (!modelSelect.value) {
    showInputError(modelSelect, 'Please select an AI model to use.');
    isValid = false;
  }

  // 2. API Key
  if (!apiKeyInput.value.trim()) {
    showInputError(apiKeyInput, 'API key is required.');
    isValid = false;
  }

  // 3. Topic
  if (!topicInput.value.trim()) {
    showInputError(topicInput, 'Quiz topic is required.');
    isValid = false;
  }

  return isValid;
}

function showInputError(inputEl, message) {
  const group = inputEl.closest('.form-group');
  group.classList.add('has-error');
  
  const errorMsg = document.createElement('p');
  errorMsg.className = 'input-error-msg';
  errorMsg.style.color = 'var(--danger)';
  errorMsg.style.fontSize = '12px';
  errorMsg.style.marginTop = '6px';
  errorMsg.style.fontWeight = '500';
  errorMsg.textContent = message;
  
  group.appendChild(errorMsg);
}

function saveConfiguration() {
  const provider = getProviderByModel(state.selectedModel);
  const enteredKey = apiKeyInput.value.trim();
  
  state.apiKeys[provider] = enteredKey;
  localStorage.setItem('ai_quiz_api_keys', JSON.stringify(state.apiKeys));
  
  state.topic = topicInput.value.trim();

  // Update badge immediately
  keySavedBadge.classList.add('visible');
}

// 5. Quiz Generation (API Integration)
async function generateQuiz() {
  switchScreen('loading');
  updateLoadingProgress(15, 'Preparing API Request...');

  const provider = getProviderByModel(state.selectedModel);
  const apiKey = state.apiKeys[provider];

  const systemInstructions = `You are a professional quiz generator. Create exactly 5 multiple choice questions about: "${state.topic}".
Return ONLY a valid JSON object matching the requested schema. Do not output any markdown formatting, code block markers (\`\`\`json), or explanations.`;

  const userPrompt = `Generate a JSON object containing a "questions" array of exactly 5 multiple choice questions about the topic: "${state.topic}".
Each question object MUST contain:
- "question": (string) The clear question text.
- "options": (array of strings) Exactly 4 plausible options.
- "correctAnswer": (string) One of the options, matching it EXACTLY, character-for-character.

Expected JSON Format:
{
  "questions": [
    {
      "question": "Sample Question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}

Double check that the correctAnswer matches one of the options elements exactly.`;

  try {
    updateLoadingProgress(40, 'Contacting AI Service...');
    
    let rawResponse = '';
    
    if (provider === 'gemini') {
      rawResponse = await fetchGeminiQuiz(apiKey, systemInstructions + "\n\n" + userPrompt);
    } else if (provider === 'openai') {
      rawResponse = await fetchOpenAIQuiz(apiKey, systemInstructions, userPrompt);
    } else if (provider === 'anthropic') {
      rawResponse = await fetchAnthropicQuiz(apiKey, systemInstructions + "\n\n" + userPrompt);
    }

    updateLoadingProgress(80, 'Parsing generated quiz content...');
    
    const parsedData = parseAndValidateQuizJson(rawResponse);
    state.questions = parsedData.questions;
    
    updateLoadingProgress(100, 'Quiz ready! Let\'s begin.');
    
    // Wait for the progress bar animation
    setTimeout(() => {
      startQuiz();
    }, 600);

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    showErrorScreen(error, provider);
  }
}

function updateLoadingProgress(percent, statusMessage) {
  loadingProgressBar.style.width = `${percent}%`;
  loadingStatus.textContent = statusMessage;
}

// Providers implementations
async function fetchGeminiQuiz(apiKey, prompt) {
  // Use Gemini 2.5 flash or pro.
  // Gemini model mapping:
  const modelId = state.selectedModel; // e.g., 'gemini-2.5-flash' or 'gemini-2.5-pro'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (Status ${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  
  // Extract text
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Gemini API returned an empty or unstructured response.');
}

async function fetchOpenAIQuiz(apiKey, systemMsg, userMsg) {
  const modelId = state.selectedModel; // e.g. 'gpt-4o' or 'gpt-4'
  const endpoint = `https://api.openai.com/v1/chat/completions`;

  const payload = {
    model: modelId,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg }
    ],
    response_format: { type: "json_object" }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorDetails = errorData.error?.message || response.statusText;
    throw new Error(`OpenAI API error (Status ${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function fetchAnthropicQuiz(apiKey, combinedPrompt) {
  // Claude model mapping
  const modelId = state.selectedModel === 'claude-3-5-sonnet' ? 'claude-3-5-sonnet-20241022' : state.selectedModel;
  const endpoint = `https://api.anthropic.com/v1/messages`;

  const payload = {
    model: modelId,
    max_tokens: 4000,
    messages: [
      { role: 'user', content: combinedPrompt }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorDetails = errorData.error?.message || response.statusText;
    throw new Error(`Anthropic API error (Status ${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Clean and validate JSON responses
function parseAndValidateQuizJson(rawText) {
  let cleaned = rawText.trim();
  
  // Extract block from within markdown codes if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/, '');
    cleaned = cleaned.replace(/```$/, '');
    cleaned = cleaned.trim();
  }
  
  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed JSON string:', cleaned);
    throw new Error('Response is not valid JSON. Please try again.');
  }

  if (!data || !Array.isArray(data.questions)) {
    throw new Error('Invalid JSON format: missing "questions" array.');
  }

  if (data.questions.length !== 5) {
    throw new Error(`Invalid quantity: expected exactly 5 questions, but received ${data.questions.length}.`);
  }

  // Validate fields in each question
  data.questions.forEach((q, idx) => {
    if (!q.question || typeof q.question !== 'string') {
      throw new Error(`Question ${idx + 1} is missing a valid "question" text.`);
    }
    
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${idx + 1} does not have exactly 4 options.`);
    }

    q.options.forEach((opt, optIdx) => {
      if (opt === undefined || opt === null || opt === '') {
        throw new Error(`Question ${idx + 1} option ${optIdx + 1} is empty.`);
      }
    });

    if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
      throw new Error(`Question ${idx + 1} is missing a valid "correctAnswer" string.`);
    }

    const exactMatch = q.options.some(opt => opt === q.correctAnswer);
    if (!exactMatch) {
      console.warn(`Question ${idx + 1} answer mismatch. Fixing case-insensitive or whitespace differences...`);
      // Try to find closest match
      const matchedIdx = q.options.findIndex(opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
      if (matchedIdx !== -1) {
        q.correctAnswer = q.options[matchedIdx]; // Fix value
      } else {
        throw new Error(`Question ${idx + 1} "correctAnswer" (${q.correctAnswer}) does not match any of the provided options.`);
      }
    }
  });

  return data;
}

// Error state display
function showErrorScreen(error, provider) {
  switchScreen('error');
  errorDescription.textContent = error.message;

  // Build helpful tips
  let tips = '';
  
  if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
    tips = `
      <li><strong>CORS Blocked:</strong> Direct browser requests to ${provider.toUpperCase()} are blocked by default.</li>
      <li>To fix this:
        <ul>
          <li>Install a browser extension like <em>CORS Unblock</em> for local testing.</li>
          <li>For the easiest setup, use <strong>Gemini models</strong> which natively allow browser calls and do not block CORS.</li>
        </ul>
      </li>
    `;
  } else {
    tips = `
      <li>Check if your <strong>API Key</strong> is valid, active, and has sufficient quota.</li>
      <li>Confirm you have selected the correct model (e.g., GPT models require an OpenAI key).</li>
      <li>Verify your topic isn't violating safety filters of the selected AI model.</li>
      <li>Check your internet connection and try again.</li>
    `;
  }
  
  errorRemedyTips.innerHTML = tips;
}

// 6. Quiz Gameplay Screen Logic
function startQuiz() {
  state.currentIndex = 0;
  state.answers = [];
  
  // Render Meta
  quizTopicBadge.textContent = state.topic;
  quizModelBadge.textContent = getModelLabel(state.selectedModel);
  
  switchScreen('quiz');
  loadQuestion();
}

function getModelLabel(modelId) {
  const labels = {
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gpt-4o': 'GPT-4o',
    'gpt-4': 'GPT-4',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet'
  };
  return labels[modelId] || modelId;
}

function loadQuestion() {
  const questionObj = state.questions[state.currentIndex];
  
  // Update progress headers
  const qNum = state.currentIndex + 1;
  progressQuestionNum.textContent = `Question ${qNum} of 5`;
  
  const percentage = Math.round((qNum / 5) * 100);
  progressQuestionPercent.textContent = `${percentage}%`;
  quizProgressFill.style.width = `${percentage}%`;
  
  // Render Text
  questionText.textContent = questionObj.question;
  
  // Render Choices Grid
  optionsContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  
  questionObj.options.forEach((opt, idx) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.dataset.index = idx;
    button.dataset.value = opt;
    
    button.innerHTML = `
      <span class="option-letter">${letters[idx]}</span>
      <span class="option-val">${escapeHtml(opt)}</span>
    `;
    
    button.addEventListener('click', () => selectAnswer(opt, button));
    optionsContainer.appendChild(button);
  });
  
  // Reset and start 30s countdown
  resetTimer();
  startCountdown();
}

// Circular timer countdown logic
function resetTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timeLeft = 30;
  timerCountdown.textContent = '30';
  
  // Reset visual SVG offsets
  timerIndicator.setAttribute('stroke-dashoffset', '0');
  timerIndicator.classList.remove('timer-low');
  timerCountdown.classList.remove('timer-low-text');
}

function startCountdown() {
  const totalOffset = 282.7; // circumference for r=45
  
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    
    // Update Text
    timerCountdown.textContent = state.timeLeft;
    
    // Update SVG Stroke Offset
    const offset = totalOffset * (1 - state.timeLeft / 30);
    timerIndicator.setAttribute('stroke-dashoffset', offset);
    
    // Low time visual warnings
    if (state.timeLeft <= 10) {
      timerIndicator.classList.add('timer-low');
      timerCountdown.classList.add('timer-low-text');
    }
    
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// Triggered when an answer is selected
function selectAnswer(selectedValue, selectedButton) {
  // Stop countdown immediately
  clearInterval(state.timerInterval);
  
  const questionObj = state.questions[state.currentIndex];
  const isCorrect = (selectedValue === questionObj.correctAnswer);
  
  // Save answer state
  state.answers.push({
    questionIndex: state.currentIndex,
    selected: selectedValue,
    correct: isCorrect,
    status: isCorrect ? 'correct' : 'wrong'
  });
  
  // Style option buttons
  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true; // Disable physically
    
    const val = btn.dataset.value;
    if (val === questionObj.correctAnswer) {
      btn.classList.add('correct'); // correct button turns green
    } else if (btn === selectedButton && !isCorrect) {
      btn.classList.add('incorrect'); // wrong button turns red
    }
  });

  // Brief delay to allow users to verify results before advancing
  setTimeout(() => {
    advanceQuiz();
  }, 2000);
}

// Timeout handler
function handleTimeout() {
  // Save as unanswered
  state.answers.push({
    questionIndex: state.currentIndex,
    selected: null,
    correct: false,
    status: 'unanswered'
  });
  
  const questionObj = state.questions[state.currentIndex];
  
  // Highlight correct answer and lock buttons
  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
    
    const val = btn.dataset.value;
    if (val === questionObj.correctAnswer) {
      btn.classList.add('correct');
    }
  });

  // Short timeout visual delay
  setTimeout(() => {
    advanceQuiz();
  }, 2000);
}

// Move to next question or screen
function advanceQuiz() {
  if (state.currentIndex < 4) {
    state.currentIndex++;
    loadQuestion();
  } else {
    showResults();
  }
}

// 7. Results Screen Rendering
function showResults() {
  // Stop timer just in case
  if (state.timerInterval) clearInterval(state.timerInterval);
  
  // Calculate details
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  
  state.answers.forEach(ans => {
    if (ans.status === 'correct') correctCount++;
    else if (ans.status === 'wrong') wrongCount++;
    else if (ans.status === 'unanswered') unansweredCount++;
  });
  
  const total = state.questions.length;
  const percentage = Math.round((correctCount / total) * 100);
  
  // Update Title Elements
  resultTopicSubtitle.textContent = `Topic: ${state.topic}`;
  resultModelSubtitle.textContent = `Model: ${getModelLabel(state.selectedModel)}`;
  
  // Score displays
  resultScoreFraction.textContent = `${correctCount}/${total}`;
  resultPercent.textContent = `${percentage}%`;
  
  // Get Performance messages
  let performanceClass = '';
  let performanceLabel = '';
  let feedback = '';
  
  if (percentage >= 90) {
    performanceClass = 'perf-excellent';
    performanceLabel = 'Excellent';
    feedback = 'Outstanding! You have a masterful understanding of this topic.';
  } else if (percentage >= 70) {
    performanceClass = 'perf-very-good';
    performanceLabel = 'Very Good';
    feedback = 'Great job! You answered most questions correctly and demonstrate strong command.';
  } else if (percentage >= 50) {
    performanceClass = 'perf-good';
    performanceLabel = 'Good';
    feedback = 'Nice effort! You passed, but there is still some room for refinement.';
  } else if (percentage >= 30) {
    performanceClass = 'perf-average';
    performanceLabel = 'Average';
    feedback = 'Keep practicing! Review this topic and try generating a new quiz to learn more.';
  } else {
    performanceClass = 'perf-needs-imp';
    performanceLabel = 'Needs Improvement';
    feedback = 'Don\'t be discouraged! Re-read the material and try again to improve your score.';
  }
  
  resultPerformanceBadge.className = `result-badge-badge ${performanceClass}`;
  resultPerformanceBadge.textContent = performanceLabel;
  resultFeedbackMessage.textContent = feedback;
  
  // Stats grid
  statTotal.textContent = total;
  statCorrect.textContent = correctCount;
  statWrong.textContent = wrongCount;
  statUnanswered.textContent = unansweredCount;
  
  switchScreen('result');
}

// Restart quiz helper
function restartQuiz(replaySameQuestions = false) {
  if (replaySameQuestions) {
    startQuiz(); // Re-runs using already stored state.questions
  } else {
    // Clear state questions and switch back to setup screen
    state.questions = [];
    state.currentIndex = 0;
    state.answers = [];
    
    // Clear fields
    topicInput.value = '';
    
    switchScreen('home');
  }
}

// Sanitization utility
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
