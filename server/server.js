require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 启用CORS和JSON解析中间件
app.use(cors());
app.use(express.json());

// 服务静态文件
app.use(express.static(path.join(__dirname, '../public')));

// DeepSeek R1 API配置
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const API_KEY = process.env.API_KEY;

// 处理聊天请求
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        // 设置API请求头
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        };

        // 设置API请求体
        const body = {
            model: 'deepseek-r1-250120',
            messages: messages,
            stream: true,
            temperature: 0.6
        };

        // 设置响应头以支持流式输出
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 发送API请求
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            timeout: 60000 // 60秒超时
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        // 处理流式响应
        for await (const chunk of response.body) {
            const text = chunk.toString();
            res.write(`data: ${text}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});