// ============================================
// 博客 JavaScript - 文章列表 & 详情
// ============================================

const GITHUB_REPO = 'portfolio';
const GITHUB_USER = 'mizzen-ink';
const BLOG_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/posts`;

let allPosts = [];
let currentFilter = 'all';

// ============================================
// 加载文章列表
// ============================================
async function loadPosts() {
    const listEl = document.getElementById('blog-list');
    if (!listEl) return;

    try {
        // 先尝试加载 index.json（快速加载）
        try {
            const indexRes = await fetch(`${BLOG_API}/index.json`, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' }
            });
            if (indexRes.ok) {
                allPosts = await indexRes.json();
                renderPosts(allPosts);
                renderFilters();
                return;
            }
        } catch (e) { /* fallback */ }

        // 如果 index.json 不存在，从 posts 目录列出所有 .md 文件
        const res = await fetch(`${BLOG_API}?ref=main`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!res.ok) {
            listEl.innerHTML = `
                <div class="blog-empty">
                    <i class="fas fa-book-open"></i>
                    <h3>还没有文章</h3>
                    <p>快去写第一篇技术文章吧！</p>
                    <a href="editor/" class="btn btn-primary">写文章</a>
                </div>`;
            return;
        }

        const files = await res.json();
        const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== 'README.md');

        if (mdFiles.length === 0) {
            listEl.innerHTML = `
                <div class="blog-empty">
                    <i class="fas fa-book-open"></i>
                    <h3>还没有文章</h3>
                    <p>快去写第一篇技术文章吧！</p>
                    <a href="editor/" class="btn btn-primary">写文章</a>
                </div>`;
            return;
        }

        // 读取每个文件的内容
        const posts = [];
        for (const file of mdFiles) {
            try {
                const contentRes = await fetch(file.download_url);
                const content = await contentRes.text();
                const { title, description, tags, date } = parseFrontmatter(content);
                posts.push({
                    title: title || file.name.replace('.md', ''),
                    description: description || '',
                    tags: tags || ['技术'],
                    date: date || '',
                    filename: file.name,
                    url: file.download_url
                });
            } catch (e) {
                console.warn('Failed to parse:', file.name);
            }
        }

        allPosts = posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        renderPosts(allPosts);
        renderFilters();

    } catch (err) {
        console.error('Load posts error:', err);
        listEl.innerHTML = `
            <div class="blog-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${err.message}</p>
            </div>`;
    }
}

// ============================================
// 解析 Frontmatter
// ============================================
function parseFrontmatter(content) {
    const result = { title: '', description: '', tags: [], date: '' };

    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (match) {
        const frontmatter = match[1];
        const titleMatch = frontmatter.match(/title:\s*"(.+?)"/);
        if (titleMatch) result.title = titleMatch[1];

        const descMatch = frontmatter.match(/description:\s*"(.+?)"/);
        if (descMatch) result.description = descMatch[1];

        const tagsMatch = frontmatter.match(/tags:\s*\[([\s\S]*?)\]/);
        if (tagsMatch) {
            result.tags = tagsMatch[1].split(',').map(t =>
                t.trim().replace(/"/g, '')
            ).filter(Boolean);
        }

        const dateMatch = frontmatter.match(/date:\s*([\d-]+)/);
        if (dateMatch) result.date = dateMatch[1];
    }

    return result;
}

// ============================================
// 渲染文章列表
// ============================================
function renderPosts(posts) {
    const listEl = document.getElementById('blog-list');
    if (!listEl) return;

    if (posts.length === 0) {
        listEl.innerHTML = `
            <div class="blog-empty">
                <i class="fas fa-search"></i>
                <h3>没有匹配的文章</h3>
                <p>试试其他关键词</p>
            </div>`;
        return;
    }

    listEl.innerHTML = posts.map(post => `
        <a href="post.html?file=${post.filename}" class="blog-card">
            <div class="blog-card-date">${post.date || ''}</div>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-desc">${post.description || post.title}</p>
            <div class="blog-card-tags">
                ${(post.tags || []).map(t =>
                    `<span class="blog-tag">${t}</span>`
                ).join('')}
            </div>
            <div class="blog-card-arrow">
                <span>Read More</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        </a>
    `).join('');
}

// ============================================
// 渲染标签筛选
// ============================================
function renderFilters() {
    const filterEl = document.querySelector('.blog-filter');
    if (!filterEl) return;

    const allTags = new Set();
    allPosts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

    const tagsHtml = Array.from(allTags).sort().map(tag =>
        `<button class="filter-btn" data-filter="${tag}" onclick="filterByTag('${tag}')">${tag}</button>`
    ).join('');

    filterEl.innerHTML = `
        <button class="filter-btn active" data-filter="all" onclick="filterByTag('all')">All</button>
        ${tagsHtml}
    `;
}

// ============================================
// 筛选 & 搜索
// ============================================
function filterByTag(tag) {
    currentFilter = tag;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === tag);
    });
    filterPosts();
}

function filterPosts() {
    const searchInput = document.getElementById('blog-search');
    const query = searchInput?.value.toLowerCase().trim() || '';

    let filtered = allPosts;

    // 按标签筛选
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => (p.tags || []).includes(currentFilter));
    }

    // 按搜索词筛选
    if (query) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.description || '').toLowerCase().includes(query) ||
            (p.tags || []).some(t => t.toLowerCase().includes(query))
        );
    }

    renderPosts(filtered);
}

// ============================================
// 导航栏博客链接自动高亮
// ============================================
// 已在 main.js 中有通用逻辑，此处补充 blog 页面特定

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', loadPosts);
