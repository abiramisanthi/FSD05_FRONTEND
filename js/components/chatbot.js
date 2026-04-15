import api from '../api.js';

class Chatbot {
    constructor() {
        this.initialized = false;
        this.isOpen = false;
        this.isTyping = false;
    }

    init() {
        // Don't show chatbot on login/register/root pages
        const path = window.location.pathname;
        if (path === '/login' || path === '/register' || path === '/') {
            this.destroy();
            return;
        }

        if (this.initialized && document.getElementById('chatbot-container')) return;

        this.render();
        this.bindEvents();
        this.initialized = true;

        // Welcome message
        setTimeout(() => {
            if (this.initialized) {
                this.addMessage('Bot', 'Hi! 👋 How can I help with your access requests?');
            }
        }, 800);
    }

    render() {
        // Remove existing one if any
        this.destroy();

        const container = document.createElement('div');
        container.id = 'chatbot-container';
        container.innerHTML = `
            <button id="chatbotToggle" class="chatbot-toggle" title="Chat with AI">
                💬
                <span class="chat-indicator"></span>
            </button>

            <div id="chatbotWindow" class="chatbot-window hidden">
                <div class="chat-header">
                    <div class="chat-header-avatar">🤖</div>
                    <div class="chat-header-info">
                        <h4>AI Assistant</h4>
                        <p>Powered by Gemini</p>
                    </div>
                    <button id="chatbotClose" class="chat-close-btn">&times;</button>
                </div>
                
                <div id="chatMessages" class="chat-messages" style="display: flex; flex-direction: column; overflow-y: auto; flex: 1;">
                    <!-- Messages will appear here -->
                    <div id="typingIndicator" class="typing-indicator" style="display: none; margin: 10px;">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>

                <div class="chat-starters" id="chatStarters" style="margin-bottom: 5px;">
                    <button class="chat-chip">How do I request access?</button>
                    <button class="chat-chip">Approval process?</button>
                </div>

                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Ask me anything..." autocomplete="off">
                    <button id="chatSend" class="chat-send-btn">➤</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    bindEvents() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const input = document.getElementById('chatInput');
        const send = document.getElementById('chatSend');
        const starters = document.querySelectorAll('.chat-chip');

        toggle.addEventListener('click', () => this.toggleWindow());
        close.addEventListener('click', () => this.toggleWindow(false));

        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        starters.forEach(chip => {
            chip.addEventListener('click', (e) => {
                input.value = e.target.innerText;
                this.sendMessage();
                document.getElementById('chatStarters').style.display = 'none';
            });
        });
    }

    toggleWindow(force) {
        this.isOpen = force !== undefined ? force : !this.isOpen;
        const windowEl = document.getElementById('chatbotWindow');
        const indicator = document.querySelector('.chat-indicator');
        
        if (this.isOpen) {
            if (windowEl) windowEl.classList.remove('hidden');
            if (indicator) indicator.style.display = 'none';
        } else {
            if (windowEl) windowEl.classList.add('hidden');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message || this.isTyping) return;

        input.value = '';
        this.addMessage('User', message);
        
        const starters = document.getElementById('chatStarters');
        if (starters) starters.style.display = 'none';

        this.setTyping(true);
        try {
            const data = await api.chat({ message });
            this.setTyping(false);
            
            let botReply = data.reply || 'Sorry, I couldn\'t process that.';
            this.addMessage('Bot', botReply);
        } catch (error) {
            this.setTyping(false);
            this.addMessage('Bot', 'Oops, something went wrong. AI circuits are a bit fuzzy right now.');
        }
    }

    setTyping(status) {
        this.isTyping = status;
        const indicator = document.getElementById('typingIndicator');
        const sendBtn = document.getElementById('chatSend');
        
        if (status) {
            indicator.style.display = 'flex';
            sendBtn.disabled = true;
        } else {
            indicator.style.display = 'none';
            sendBtn.disabled = false;
        }
        
        this.scrollToBottom();
    }

    addMessage(sender, text) {
        const messagesEl = document.getElementById('chatMessages');
        if (!messagesEl) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender.toLowerCase()}`;
        
        const avatarStr = sender === 'Bot' ? '🤖' : '👤';
        
        // Compact markdown
        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = `
            <div class="chat-msg-avatar">${avatarStr}</div>
            <div class="chat-bubble" style="box-shadow: 0 2px 10px rgba(0,0,0,0.05);">${formattedText}</div>
        `;
        
        // Insert before typing indicator
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            messagesEl.insertBefore(msgDiv, typingIndicator);
        } else {
            messagesEl.appendChild(msgDiv);
        }
        
        this.scrollToBottom();

        // If closed and bot replies, show dot
        if (!this.isOpen && sender === 'Bot') {
            const indicator = document.querySelector('.chat-indicator');
            if (indicator) indicator.style.display = 'block';
        }
    }

    scrollToBottom() {
        const messagesEl = document.getElementById('chatMessages');
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    destroy() {
        const container = document.getElementById('chatbot-container');
        if (container) {
            container.remove();
        }
        this.initialized = false;
    }
}

export default new Chatbot();
