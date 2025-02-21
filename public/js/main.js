// 获取DOM元素
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 存储对话历史
let messageHistory = [
    {
        role: 'system',
        content: '你是一位专业的生活教练AI助手，通过对话为用户提供个性化的建议和指导，帮助用户实现个人成长。你应该：\n1. 认真倾听用户的问题和困扰\n2. 提供具体、可行的建议\n3. 鼓励用户设定目标并采取行动\n4. 保持积极、专业的态度'
    },
    {
        role: 'assistant',
        content: '你好！我是你的AI生活教练。我会通过对话了解你的需求，为你提供个性化的建议和指导。让我们开始吧！'
    }
];

// 创建消息元素
function createMessageElement(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

// 创建打字机效果
function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        indicator.appendChild(dot);
    }
    return indicator;
}

// 添加消息到聊天界面
function appendMessage(content, isUser = false) {
    const messageElement = createMessageElement(content, isUser);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 处理用户输入
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    // 禁用输入和发送按钮
    userInput.disabled = true;
    sendButton.disabled = true;

    // 显示用户消息
    appendMessage(message, true);
    messageHistory.push({ role: 'user', content: message });
    userInput.value = '';

    // 显示加载动画
    const typingIndicator = createTypingIndicator();
    chatMessages.appendChild(typingIndicator);

    try {
        // 发送请求到服务器
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        if (!response.ok) {
            throw new Error('网络请求失败');
        }

        // 处理流式响应
        const reader = response.body.getReader();
        let aiResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解析响应数据
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0].delta.content) {
                            aiResponse += parsed.choices[0].delta.content;
                            // 更新AI回复内容
                            if (chatMessages.lastChild.classList.contains('ai')) {
                                chatMessages.lastChild.querySelector('.message-content').textContent = aiResponse;
                            } else {
                                appendMessage(aiResponse);
                            }
                        }
                    } catch (e) {
                        console.error('解析响应数据失败:', e);
                    }
                }
            }
        }

        // 保存AI回复到历史记录
        messageHistory.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        console.error('请求失败:', error);
        appendMessage('抱歉，发生了一些错误，请稍后重试。');
    } finally {
        // 移除加载动画
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.remove();
        }

        // 启用输入和发送按钮
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// 绑定事件监听器
sendButton.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// 自动聚焦输入框
userInput.focus();