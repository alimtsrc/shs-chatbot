// =============================================
//  AIMbassador — UCC AI Chatbot
//  app.js
// =============================================

let conversationHistory = [];

// ---- DOM Elements ----
const messagesArea = document.getElementById('messagesArea');
const userInput    = document.getElementById('userInput');
const sendBtn      = document.getElementById('sendBtn');
const clearBtn     = document.getElementById('clearBtn');

// ---- Auto-resize textarea ----
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// ---- Send on Enter (Shift+Enter = new line) ----
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);

// ---- Quick action buttons (delegated) ----
messagesArea.addEventListener('click', (e) => {
  if (e.target.classList.contains('quick-btn')) {
    const msg = e.target.dataset.msg;
    if (msg) sendMessage(msg);
  }
});

// ---- Clear chat ----
clearBtn.addEventListener('click', () => {
  if (conversationHistory.length === 0) return;
  if (confirm('Clear this conversation?')) {
    conversationHistory = [];
    const msgs = messagesArea.querySelectorAll('.message:not(#welcomeMsg)');
    msgs.forEach(m => m.remove());

    // restore quick actions
    const qa = document.querySelector('#welcomeMsg .quick-actions');
    if (qa) qa.style.display = 'flex';
  }
});

// ---- Main send handler ----
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;
  sendMessage(text);
}

async function sendMessage(text) {
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;

  // hide welcome quick buttons after first message
  const qa = document.querySelector('#welcomeMsg .quick-actions');
  if (qa) qa.style.display = 'none';

  appendMessage('user', text);

  conversationHistory.push({ role: 'user', content: text });

  const typingId = showTyping();

  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory.slice(-10)
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || "I'm sorry, I couldn't generate a response. Please try again.";

    removeTyping(typingId);
    appendMessage('bot', reply);

    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    removeTyping(typingId);
    appendMessage('bot', `⚠️ Something went wrong: ${err.message}. Please try again.`);
    console.error('AIMbassador error:', err);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

// ---- DOM Helpers ----
function appendMessage(role, text) {
  const isBot = role === 'bot';

  const wrapper = document.createElement('div');
  wrapper.className = `message ${isBot ? 'bot-message' : 'user-message'}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${isBot ? 'bot-avatar' : 'user-avatar'}`;
  avatar.innerHTML = isBot
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`
    : `<span>You</span>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatMessage(text);

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = getTime();

  const inner = document.createElement('div');
  inner.style.cssText = 'display:flex;flex-direction:column;min-width:0;';
  inner.appendChild(bubble);
  inner.appendChild(timeEl);

  wrapper.appendChild(avatar);
  wrapper.appendChild(inner);

  messagesArea.appendChild(wrapper);
  scrollToBottom();
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function showTyping() {
  const id = 'typing-' + Date.now();
  const wrapper = document.createElement('div');
  wrapper.className = 'message bot-message typing-indicator';
  wrapper.id = id;
  wrapper.innerHTML = `
    <div class="msg-avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
    </div>
    <div class="msg-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  messagesArea.appendChild(wrapper);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

// ---- Init ----
userInput.focus();