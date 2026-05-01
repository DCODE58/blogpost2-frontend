// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' error' : ''}`;
  setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ── HELPERS ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

function padNum(n) {
  return String(n).padStart(3, '0');
}

// ── STATE ──────────────────────────────────────────────────────────────
let currentPage     = 1;
let currentSearch   = '';
let currentCategory = '';
let debounceTimer;
let heroSet         = false;

// ── HERO ───────────────────────────────────────────────────────────────
function populateHero(post) {
  if (!post) return;
  const anchor = document.getElementById('hero-featured');
  if (!anchor) return;

  anchor.href = `post.html?id=${post.id}`;

  if (post.image_url) {
    const wrap = document.getElementById('hero-img-wrap');
    wrap.innerHTML = `<img src="${post.image_url}" alt="${post.title}" />`;
    wrap.className = 'hero-right';
  }

  document.getElementById('hero-cat').textContent   = post.category || 'General';
  document.getElementById('hero-title').textContent = post.title;
  document.getElementById('hero-overlay').style.display = 'block';
}

// ── SKELETON ───────────────────────────────────────────────────────────
function showSkeletons() {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = Array(6).fill(0).map((_, i) => `
    <div class="post-card" style="pointer-events:none" ${i === 0 ? 'style="grid-column:span 2;pointer-events:none"' : ''}>
      <div class="post-card-image skeleton" style="aspect-ratio:16/9;border-bottom:3px solid #C8C5BE"></div>
      <div class="post-card-body">
        <div class="skeleton" style="height:18px;width:70px;margin-bottom:0.8rem"></div>
        <div class="skeleton" style="height:26px;width:90%;margin-bottom:0.4rem"></div>
        <div class="skeleton" style="height:26px;width:70%;margin-bottom:1rem"></div>
        <div class="skeleton" style="height:12px;width:100%;margin-bottom:0.4rem"></div>
        <div class="skeleton" style="height:12px;width:85%;margin-bottom:0.4rem"></div>
        <div class="skeleton" style="height:12px;width:65%"></div>
      </div>
    </div>`).join('');
}

// ── RENDER POSTS ───────────────────────────────────────────────────────
function renderPosts(posts) {
  const grid = document.getElementById('posts-grid');

  if (!posts.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">404</span>
        <h3>No Stories Found</h3>
        <p>Try a different search term or topic.</p>
      </div>`;
    return;
  }

  grid.innerHTML = posts.map((post, i) => {
    const globalNum  = (currentPage - 1) * 9 + i + 1;
    const excerpt    = stripHtml(post.excerpt || post.content || '').slice(0, 160).trim() + '…';
    const isFeature  = i === 0 && currentPage === 1;

    const imageBlock = post.image_url
      ? `<a href="post.html?id=${post.id}" class="post-card-image">
           <span class="post-num">#${padNum(globalNum)}</span>
           <img src="${post.image_url}" alt="${post.title}" loading="lazy" />
         </a>`
      : `<a href="post.html?id=${post.id}" class="post-card-image no-image">
           <span class="post-num">#${padNum(globalNum)}</span>
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
             <rect x="3" y="3" width="18" height="18" rx="0"/>
             <path d="m3 9 4-4 4 4 4-4 4 4"/>
             <circle cx="8.5" cy="14.5" r="1.5"/>
           </svg>
         </a>`;

    return `
      <article class="post-card">
        ${imageBlock}
        <div class="post-card-body">
          <span class="post-card-category">${post.category || 'General'}</span>
          <a href="post.html?id=${post.id}">
            <h2 class="post-card-title">${post.title}</h2>
          </a>
          <p class="post-card-excerpt">${excerpt}</p>
          <div class="post-card-footer">
            <div class="post-card-meta">
              <span class="post-card-date">${fmtDate(post.created_at)}</span>
              <span class="post-card-views">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                ${post.views} views
              </span>
            </div>
            <a href="post.html?id=${post.id}" class="read-more">
              Read
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ── PAGINATION ─────────────────────────────────────────────────────────
function renderPagination(total, page, limit) {
  const pages = Math.ceil(total / limit);
  const pag   = document.getElementById('pagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  if (page > 1)
    html += `<button class="page-btn" onclick="goPage(${page - 1})">&larr; Prev</button>`;
  for (let i = 1; i <= pages; i++)
    html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="goPage(${i})">${i}</button>`;
  if (page < pages)
    html += `<button class="page-btn" onclick="goPage(${page + 1})">Next &rarr;</button>`;

  pag.innerHTML = html;
}

window.goPage = (p) => {
  currentPage = p;
  fetchPosts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── FETCH ──────────────────────────────────────────────────────────────
async function fetchPosts() {
  showSkeletons();

  const params = new URLSearchParams({
    page:  currentPage,
    limit: 9,
    ...(currentSearch   && { search: currentSearch }),
    ...(currentCategory && { category: currentCategory }),
  });

  try {
    const res = await fetch(`${window.API_BASE}/posts?${params}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    const countEl = document.getElementById('post-count');
    const secCount = document.getElementById('section-count');
    const label = `${data.total} post${data.total !== 1 ? 's' : ''}`;
    if (countEl)   countEl.textContent  = label;
    if (secCount)  secCount.textContent = label;

    if (!heroSet && data.posts.length && !currentSearch && !currentCategory) {
      populateHero(data.posts[0]);
      heroSet = true;
    }

    renderPosts(data.posts);
    renderPagination(data.total, data.page, data.limit);
  } catch {
    showToast('Could not load posts. Is the backend running?', 'error');
    document.getElementById('posts-grid').innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">ERR</span>
        <h3>Connection Failed</h3>
        <p>Please check the backend is running and try again.</p>
      </div>`;
  }
}

// ── EVENTS ─────────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage   = 1;
    fetchPosts();
  }, 380);
});

document.getElementById('category-filter').addEventListener('change', (e) => {
  currentCategory = e.target.value;
  currentPage     = 1;
  fetchPosts();
});

// ── INIT ───────────────────────────────────────────────────────────────
fetchPosts();
