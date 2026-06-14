// ============================================
// 编辑器 JavaScript
// ============================================

// GitHub 配置
const GITHUB_USER = 'mizzen-ink';
const GITHUB_REPO = 'portfolio';
const API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`;

// 如果 URL 有 token 参数，保存到 localStorage
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
if (urlToken) {
    localStorage.setItem('github_token', urlToken);
    window.history.replaceState({}, '', window.location.pathname);
}

function getToken() {
    return localStorage.getItem('github_token');
}

// ============================================
// Markdown 实时预览
// ============================================
const editor = document.getElementById('markdown-editor');
const preview = document.getElementById('preview');
const titleInput = document.getElementById('post-title');
const wordCount = document.getElementById('word-count');

if (editor && preview) {
    editor.addEventListener('input', updatePreview);
    editor.addEventListener('input', updateWordCount);
}

function updatePreview() {
    if (preview && editor) {
        preview.innerHTML = marked.parse(editor.value, { breaks: true });
        // 高亮代码块
        document.querySelectorAll('pre code').forEach(block => {
            hljs?.highlightElement?.(block);
        });
    }
}

function updateWordCount() {
    if (wordCount && editor) {
        const text = editor.value.trim();
        const chars = text.replace(/\s/g, '').length;
        wordCount.textContent = `${chars} 字`;
    }
}

// ============================================
// 工具栏按钮：插入 Markdown
// ============================================
function insertMarkdown(before, after) {
    const textarea = document.getElementById('markdown-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = before + selected + after;

    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();

    // 如果没有选中文本，把光标放在 before/after 中间
    if (!selected) {
        const cursorPos = start + before.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
    }
    updatePreview();
}

// ============================================
// 设置 GitHub Token
// ============================================
function showTokenSetup() {
    const modal = document.getElementById('token-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('token-input')?.focus();
    } else {
        // Fallback prompt
        setToken();
    }
}

function setToken() {
    const token = prompt('请输入 GitHub Personal Access Token (ghp_...):');
    if (token && token.trim()) {
        localStorage.setItem('github_token', token.trim());
        showToast('Token 已保存', 'success');
    }
}

function saveTokenFromModal() {
    const input = document.getElementById('token-input');
    const token = input?.value.trim();
    if (token) {
        localStorage.setItem('github_token', token);
        showToast('Token 已保存，现在可以发布文章了！', 'success');
        document.getElementById('token-modal')?.classList.remove('active');
        input.value = '';
    } else {
        showToast('请输入有效的 Token', 'error');
    }
}

// ============================================
// 发布文章到 GitHub
// ============================================
async function publishPost() {
    const title = document.getElementById('post-title')?.value.trim();
    const content = document.getElementById('markdown-editor')?.value.trim();
    const tags = document.getElementById('post-tags')?.value.trim();
    const desc = document.getElementById('post-desc')?.value.trim();

    if (!title) {
        showToast('请填写文章标题', 'error');
        document.getElementById('post-title')?.focus();
        return;
    }
    if (!content) {
        showToast('请填写文章内容', 'error');
        editor?.focus();
        return;
    }

    const token = getToken();
    if (!token) {
        showToast('请先设置 GitHub Token（点右上角 Token）', 'error');
        return;
    }

    // 生成文件名：slug + 日期
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const slug = title
        .toLowerCase()
        .replace(/[^\w一-龥]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const filename = `${dateStr}-${slug}.md`;
    const filepath = `posts/${filename}`;

    // 构建文章元信息
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['技术'];
    const description = desc || title;

    const frontmatter = `---
title: "${title}"
date: ${dateStr}
tags: [${tagList.map(t => `"${t}"`).join(', ')}]
description: "${description}"
---

`;

    const postContent = frontmatter + content;

    // 先检查文件是否存在
    let sha = null;
    try {
        const checkRes = await fetch(`${API_BASE}/contents/${filepath}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (checkRes.ok) {
            const existing = await checkRes.json();
            sha = existing.sha;
        }
    } catch (e) {
        // 文件不存在，忽略
    }

    // 上传到 GitHub
    const commitMsg = sha
        ? `update: ${title}`
        : `new: ${title}`;

    const body = {
        message: commitMsg,
        content: btoa(unescape(encodeURIComponent(postContent))),
        branch: 'main'
    };
    if (sha) body.sha = sha;

    try {
        const res = await fetch(`${API_BASE}/contents/${filepath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || '发布失败');
        }

        // 同时更新 index.json
        await updatePostsIndex(token, title, description, tagList, dateStr, filename);

        showToast('文章发布成功！', 'success');
        document.getElementById('publish-msg').textContent = `"${title}" 已保存到 GitHub，几秒后自动部署`;
        document.getElementById('publish-modal').classList.add('active');

    } catch (err) {
        showToast(`发布失败: ${err.message}`, 'error');
        console.error('Publish error:', err);
    }
}

// ============================================
// 更新文章索引
// ============================================
async function updatePostsIndex(token, title, description, tags, date, filename) {
    let posts = [];
    let sha = null;

    // 读取现有的 index.json
    try {
        const res = await fetch(`${API_BASE}/contents/posts/index.json`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (res.ok) {
            const data = await res.json();
            sha = data.sha;
            const decoded = decodeURIComponent(escape(atob(data.content)));
            posts = JSON.parse(decoded);
        }
    } catch (e) {
        // 不存在，新建
    }

    // 添加或更新文章
    const existingIdx = posts.findIndex(p => p.filename === filename);
    const postEntry = { title, description, tags, date, filename };

    if (existingIdx >= 0) {
        posts[existingIdx] = postEntry;
    } else {
        posts.unshift(postEntry);
    }

    const body = {
        message: `update: posts index (${title})`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2)))),
        branch: 'main'
    };
    if (sha) body.sha = sha;

    try {
        await fetch(`${API_BASE}/contents/posts/index.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.warn('Index update failed:', e);
    }
}

// ============================================
// Toast 提示
// ============================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon} ${type}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Modal
// ============================================
function closeModal() {
    document.getElementById('publish-modal')?.classList.remove('active');
}
// 点击外部关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================
// 初始化
// ============================================
// 如果有初始内容，触发预览更新和字数统计
updatePreview();
updateWordCount();
