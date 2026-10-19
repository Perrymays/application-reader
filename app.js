// Storage keys
const STORAGE_KEY = 'signalpath_apps';
const SIGNAL_KEY = 'signalpath_signal';
const USER_KEY = 'signalpath_user';
const RESUME_KEY = 'signalpath_resume';
const PLAN_KEY = 'signalpath_plan';
const AUTO_KEY = 'signalpath_auto';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadApps() { return loadJSON(STORAGE_KEY, []); }
function saveApps(apps) { saveJSON(STORAGE_KEY, apps); updateDashboard(); }
function loadSignal() { return loadJSON(SIGNAL_KEY, {}); }
function saveSignal(data) { saveJSON(SIGNAL_KEY, data); updateDashboard(); }
function loadUser() { return loadJSON(USER_KEY, null); }
function saveUser(user) { saveJSON(USER_KEY, user); }
function clearUser() { localStorage.removeItem(USER_KEY); }
function loadPlan() { return localStorage.getItem(PLAN_KEY) || 'free'; }
function savePlan(plan) { localStorage.setItem(PLAN_KEY, plan); updatePlanUI(); updateDashboard(); }
function loadAuto() { return loadJSON(AUTO_KEY, []); }
function saveAuto(list) { saveJSON(AUTO_KEY, list); }

// Auth
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userMenu = document.getElementById('user-menu');
const userNameDisplay = document.getElementById('user-name-display');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const cancelLogin = document.getElementById('cancel-login');
const welcomeText = document.getElementById('welcome-text');
const planBadge = document.getElementById('plan-badge');

function updateAuthUI() {
  const user = loadUser();
  if (user) {
    loginBtn.hidden = true;
    userMenu.hidden = false;
    userNameDisplay.textContent = user.name;
    welcomeText.textContent = `Welcome back, ${user.name}.`;
  } else {
    loginBtn.hidden = false;
    userMenu.hidden = true;
    welcomeText.textContent = 'Log in to personalize your experience.';
  }
  updatePlanUI();
}

loginBtn.addEventListener('click', () => { loginModal.hidden = false; });
cancelLogin.addEventListener('click', () => { loginModal.hidden = true; });
loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.hidden = true; });

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('login-name').value.trim();
  const email = document.getElementById('login-email').value.trim();
  saveUser({ name, email });
  loginModal.hidden = true;
  updateAuthUI();
});

logoutBtn.addEventListener('click', () => {
  clearUser();
  updateAuthUI();
});

// Plan / Upgrade
const upgradeModal = document.getElementById('upgrade-modal');
const cancelUpgrade = document.getElementById('cancel-upgrade');
const upgradeFromPricing = document.getElementById('upgrade-from-pricing');
const upgradeFromLocked = document.getElementById('upgrade-from-locked');
const automatedLocked = document.getElementById('automated-locked');
const automatedUnlocked = document.getElementById('automated-unlocked');

function updatePlanUI() {
  const plan = loadPlan();
  const isPaid = plan !== 'free';
  planBadge.textContent = isPaid ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free';
  planBadge.style.background = isPaid ? '#dcfce7' : '';
  planBadge.style.color = isPaid ? '#15803d' : '';
  automatedLocked.hidden = isPaid;
  automatedUnlocked.hidden = !isPaid;
  if (isPaid) renderAutoHistory();
}

function openUpgrade() { upgradeModal.hidden = false; }
function closeUpgrade() { upgradeModal.hidden = true; }

upgradeFromPricing.addEventListener('click', openUpgrade);
upgradeFromLocked.addEventListener('click', openUpgrade);
cancelUpgrade.addEventListener('click', closeUpgrade);

// Click outside modal to close
upgradeModal.addEventListener('click', (e) => {
  if (e.target === upgradeModal) closeUpgrade();
});

// Escape key closes any open modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!upgradeModal.hidden) closeUpgrade();
    if (!loginModal.hidden) loginModal.hidden = true;
  }
});

document.querySelectorAll('.plan-option').forEach(btn => {
  btn.addEventListener('click', () => {
    savePlan(btn.dataset.plan);
    upgradeModal.hidden = true;
  });
});

// Manual Tracker
const form = document.getElementById('app-form');
const listEl = document.getElementById('app-list');

function daysSince(dateStr) {
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}
function estimateStatus(app) {
  const days = daysSince(app.applied);
  const source = app.source;
  if (source === 'referral' && days < 21) return { label: 'Likely still active', class: 'likely-seen', note: 'Referrals often move faster.' };
  if (days > 21) return { label: 'Likely ghosted / closed', class: 'likely-ghost', note: 'Most roles go silent after 3 weeks.' };
  if (days > 10) return { label: 'Possibly screened', class: 'likely-screened', note: 'Still within normal review window.' };
  return { label: 'Recently applied', class: 'likely-seen', note: 'Too early for a clear signal.' };
}

function renderApps() {
  const apps = loadApps();
  if (!apps.length) {
    listEl.innerHTML = '<p class="muted">No applications yet.</p>';
    return;
  }
  listEl.innerHTML = apps.map((app, i) => {
    const status = estimateStatus(app);
    return `
      <div class="app-item">
        <div class="app-meta"><strong>${app.role}</strong><span>${app.company} · ${app.source}</span></div>
        <div><span class="badge ${status.class}">${status.label}</span><div class="muted" style="font-size:0.85rem;margin-top:0.3rem;">${status.note}</div></div>
        <button class="delete-btn" data-index="${i}">Remove</button>
      </div>`;
  }).join('');
  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const apps = loadApps();
      apps.splice(Number(btn.dataset.index), 1);
      saveApps(apps);
      renderApps();
    });
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const apps = loadApps();
  apps.unshift({
    company: document.getElementById('company').value.trim(),
    role: document.getElementById('role').value.trim(),
    applied: document.getElementById('applied').value,
    source: document.getElementById('source').value
  });
  saveApps(apps);
  form.reset();
  document.getElementById('applied').valueAsDate = new Date();
  renderApps();
});

// Human Signal
const headlineEl = document.getElementById('headline');
const proofEl = document.getElementById('proof');
const previewEl = document.getElementById('signal-preview');
const saveSignalBtn = document.getElementById('save-signal');

function renderSignal() {
  const data = loadSignal();
  if (!data.headline && !data.proof) {
    previewEl.innerHTML = '<p class="muted">Preview appears here.</p>';
    return;
  }
  previewEl.innerHTML = `<h4>${data.headline || ''}</h4><p>${data.proof || ''}</p>`;
}
function loadSignalIntoForm() {
  const data = loadSignal();
  if (data.headline) headlineEl.value = data.headline;
  if (data.proof) proofEl.value = data.proof;
  renderSignal();
}
saveSignalBtn.addEventListener('click', () => {
  saveSignal({ headline: headlineEl.value.trim(), proof: proofEl.value.trim() });
  renderSignal();
});

// Resume
const resumeFile = document.getElementById('resume-file');
const resumeInfo = document.getElementById('resume-info');
const clearResumeBtn = document.getElementById('clear-resume');

function loadResume() {
  const name = localStorage.getItem(RESUME_KEY);
  if (name) {
    resumeInfo.textContent = `Uploaded: ${name}`;
    clearResumeBtn.hidden = false;
  } else {
    resumeInfo.textContent = 'No resume uploaded.';
    clearResumeBtn.hidden = true;
  }
  updateDashboard();
}
resumeFile.addEventListener('change', () => {
  const file = resumeFile.files[0];
  if (file) { localStorage.setItem(RESUME_KEY, file.name); loadResume(); }
});
clearResumeBtn.addEventListener('click', () => {
  localStorage.removeItem(RESUME_KEY);
  resumeFile.value = '';
  loadResume();
});

// Automated simulation
const autoForm = document.getElementById('auto-form');
const autoResult = document.getElementById('auto-result');
const autoHistory = document.getElementById('auto-history');

function simulateDelivery(company, role, url) {
  // Simple deterministic simulation based on company name hash
  const hash = company.toLowerCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const type = hash % 3;
  if (type === 0) {
    return {
      method: 'ATS / AI keyword screen',
      badge: 'ats',
      detail: 'This application likely entered an applicant tracking system that scores resumes for keywords. No human email was detected.',
      email: null,
      confidence: 'Medium'
    };
  } else if (type === 1) {
    const email = `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    return {
      method: 'Human email',
      badge: 'email',
      detail: 'This appears to route to a human inbox rather than an automated keyword filter.',
      email,
      confidence: 'High'
    };
  }
  return {
    method: 'Unknown / mixed',
    badge: 'unknown',
    detail: 'Could not confidently determine delivery path from the available information.',
    email: null,
    confidence: 'Low'
  };
}

function renderAutoHistory() {
  const list = loadAuto();
  if (!list.length) {
    autoHistory.innerHTML = '<p class="muted">No automated deliveries yet.</p>';
    return;
  }
  autoHistory.innerHTML = list.map(item => `
    <div class="app-item">
      <div class="app-meta"><strong>${item.role}</strong><span>${item.company}</span></div>
      <div>
        <span class="badge ${item.badge}">${item.method}</span>
        ${item.email ? `<div class="muted" style="font-size:0.85rem;margin-top:0.3rem;">${item.email}</div>` : ''}
      </div>
      <span class="muted" style="font-size:0.8rem;">${item.confidence}</span>
    </div>
  `).join('');
}

autoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (loadPlan() === 'free') return;
  const company = document.getElementById('auto-company').value.trim();
  const role = document.getElementById('auto-role').value.trim();
  const url = document.getElementById('auto-url').value.trim();
  const result = simulateDelivery(company, role, url);

  autoResult.hidden = false;
  autoResult.className = 'result-box';
  autoResult.innerHTML = `
    <strong>${result.method}</strong>
    <p style="margin:0.5rem 0;">${result.detail}</p>
    ${result.email ? `<p><strong>Email:</strong> ${result.email}</p>` : ''}
    <p class="muted">Confidence: ${result.confidence}. This is a local simulation for demo purposes only.</p>
  `;

  const list = loadAuto();
  list.unshift({ company, role, url, ...result, date: new Date().toISOString() });
  saveAuto(list);
  renderAutoHistory();
  autoForm.reset();
});

// Tools
const checkBtn = document.getElementById('check-btn');
const jobText = document.getElementById('job-text');
const checkResult = document.getElementById('check-result');

function analyzeJob(text) {
  const lower = text.toLowerCase();
  let score = 0;
  const flags = [];
  if (lower.includes('work from home') && (lower.includes('wire') || lower.includes('equipment fee') || lower.includes('pay to start'))) {
    score += 40; flags.push('Mentions payment or fees to start.');
  }
  if (lower.includes('urgent') && lower.includes('immediate')) { score += 15; flags.push('High urgency language.'); }
  if (!lower.includes('salary') && !lower.includes('pay') && !lower.includes('$') && !lower.includes('compensation')) {
    score += 10; flags.push('No compensation mentioned.');
  }
  if ((lower.includes('easy money') || lower.includes('no experience needed')) && lower.includes('high pay')) {
    score += 25; flags.push('Classic too-good-to-be-true phrasing.');
  }
  if (text.length < 200) { score += 10; flags.push('Very short description.'); }
  let level = 'low', label = 'Looks relatively normal';
  if (score >= 40) { level = 'high'; label = 'High risk'; }
  else if (score >= 20) { level = 'medium'; label = 'Some yellow flags'; }
  return { score, level, label, flags };
}

checkBtn.addEventListener('click', () => {
  const text = jobText.value.trim();
  if (!text) {
    checkResult.hidden = false;
    checkResult.innerHTML = '<p>Paste a job description first.</p>';
    return;
  }
  const r = analyzeJob(text);
  checkResult.hidden = false;
  checkResult.className = `result-box ${r.level}`;
  checkResult.innerHTML = `<strong>${r.label}</strong> (score: ${r.score})<ul style="margin-top:0.5rem;padding-left:1.2rem;">${r.flags.length ? r.flags.map(f => `<li>${f}</li>`).join('') : '<li>No strong red flags.</li>'}</ul><p class="muted" style="margin-top:0.5rem;">Pattern check only.</p>`;
});

const gapBtn = document.getElementById('gap-btn');
const targetRole = document.getElementById('target-role');
const gapResult = document.getElementById('gap-result');
const roleGaps = {
  pm: { name: 'Product Manager', has: ['Cross-functional leadership', 'Process improvement'], missing: ['Roadmapping tools', 'Experiment design'], advice: 'Add one concrete prioritization story.' },
  ops: { name: 'Operations Manager', has: ['Team leadership', 'Cost reduction'], missing: ['KPI ownership', 'Vendor negotiation'], advice: 'Highlight one quantified operational win.' },
  data: { name: 'Data Analyst', has: ['Spreadsheet modeling'], missing: ['SQL', 'Visualization tool'], advice: 'SQL + one portfolio project is the highest-leverage next step.' }
};
gapBtn.addEventListener('click', () => {
  const data = roleGaps[targetRole.value];
  gapResult.hidden = false;
  gapResult.innerHTML = `<strong>${data.name}</strong><p style="margin:0.5rem 0;"><strong>Likely have:</strong> ${data.has.join(', ')}</p><p><strong>Common gaps:</strong> ${data.missing.join(', ')}</p><p style="margin-top:0.75rem;">${data.advice}</p>`;
});

// Dashboard
function updateDashboard() {
  const apps = loadApps();
  const signal = loadSignal();
  const resumeName = localStorage.getItem(RESUME_KEY);
  const plan = loadPlan();
  document.getElementById('app-count').textContent = apps.length;
  document.getElementById('signal-status').textContent = (signal.headline || signal.proof) ? 'Set' : 'Not set';
  document.getElementById('resume-status').textContent = resumeName ? 'Yes' : 'None';
  document.getElementById('plan-status').textContent = plan === 'free' ? 'Free' : plan.charAt(0).toUpperCase() + plan.slice(1);
}

// Init
function init() {
  updateAuthUI();
  renderApps();
  loadSignalIntoForm();
  loadResume();
  updateDashboard();
  document.getElementById('applied').valueAsDate = new Date();
}
init();