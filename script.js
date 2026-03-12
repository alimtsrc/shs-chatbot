// =============================================
//  UNIDA CHRISTIAN COLLEGES AI CHATBOT
//  app.js — Claude-powered assistant
// =============================================

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are the official AI Assistant of Unida Christian Colleges Inc. (UNIDA), a Christian higher education institution in the Philippines established in 1996.

Your role is to assist students, faculty, and visitors with school-related inquiries in a warm, helpful, and professional manner that reflects UNIDA's Christian values.

Key information about UNIDA:
- Full name: Unida Christian Colleges Inc.
- Founded: 1996
- Type: Christian college in the Philippines
- The school crest features: a circuit board (technology), an open book with a dove and olive branch (faith & knowledge), a torch on a pillar (enlightenment), and a globe/ball (global outlook)
- Colors: Deep green and gold — symbolizing growth, faith, and excellence
- Motto/values: Christian faith, academic excellence, service

When answering:
- Be warm, respectful, and encouraging
- Use Filipino hospitality in your tone (e.g., greet warmly, be polite)
- If you don't have specific info about UNIDA, provide general helpful guidance and suggest contacting the school's registrar or admin office for official details
- Keep answers concise but complete
- You may occasionally use Filipino phrases like "po" or "salamat" to feel more natural to Filipino students
- Always uphold Christian values: integrity, kindness, service`;

// ---- State ----
let conversationHistory = [];
let chatHistory = JSON.parse(localStorage.getItem('unida_chat_history') || '[]');

// ---- DOM Elements ----
const messagesArea  = document.getElementById('messagesArea');
const userInput     = document.getElementById('userInput');
const sendBtn       = document.getElementById('sendBtn');
const clearBtn      = document.getElementById('clearBtn');
const historyList   = document.getElementById('historyList');
const navItems      = document.querySelectorAll('.nav-item');
const tabPanels     = document.querySelectorAll('.tab-panel');

// ---- Tab Navigation ----
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    navItems.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (tab === 'history') renderHistory();
  });
});

// ---- Auto-resize textarea ----
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// ---- Send on Enter (Shift+Enter for new line) ----
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
    // Remove all messages except welcome
    const msgs = messagesArea.querySelectorAll('.message:not(#welcomeMsg)');
    msgs.forEach(m => m.remove());
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

  // Hide welcome quick buttons after first user message
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    const qa = welcomeMsg.querySelector('.quick-actions');
    if (qa) qa.style.display = 'none';
  }

  // Append user message
  appendMessage('user', text);

  // Add to history
  conversationHistory.push({ role: 'user', content: text });

  // Show typing indicator
  const typingId = showTyping();

  try {
   const response = await fetch("/api/chatbot", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: text,
    history: conversationHistory.slice(-10) // last 10 messages lang para hindi mahal
  })
});

const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

    removeTyping(typingId);
    appendMessage('bot', reply);

    conversationHistory.push({ role: 'assistant', content: reply });

    // Save to localStorage history
    saveToHistory(text, reply);

  } catch (err) {
    removeTyping(typingId);
    appendMessage('bot', `⚠️ I encountered an error: ${err.message}. Please check your connection and try again.`);
    console.error('UNIDA AI Error:', err);
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
  inner.style.display = 'flex';
  inner.style.flexDirection = 'column';
  inner.appendChild(bubble);
  inner.appendChild(timeEl);

  wrapper.appendChild(avatar);
  wrapper.appendChild(inner);

  messagesArea.appendChild(wrapper);
  scrollToBottom();
}

function formatMessage(text) {
  // Basic markdown-lite: bold, line breaks
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

// ---- History ----
function saveToHistory(userMsg, botReply) {
  const entry = {
    id: Date.now(),
    title: userMsg.length > 50 ? userMsg.slice(0, 50) + '…' : userMsg,
    preview: botReply.length > 80 ? botReply.slice(0, 80) + '…' : botReply,
    date: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
  chatHistory.unshift(entry);
  if (chatHistory.length > 30) chatHistory = chatHistory.slice(0, 30);
  try { localStorage.setItem('unida_chat_history', JSON.stringify(chatHistory)); } catch(e) {}
}

function renderHistory() {
  if (chatHistory.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <p>No conversation history yet.</p>
        <span>Start a chat to see it here.</span>
      </div>`;
    return;
  }

  historyList.innerHTML = chatHistory.map(entry => `
    <div class="history-item">
      <div class="history-item-title">${escapeHtml(entry.title)}</div>
      <div class="history-item-date">${entry.date}</div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Init ----
userInput.focus();
renderHistory();