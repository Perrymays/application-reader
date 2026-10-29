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

// Premium window
const openPremium = document.getElementById('open-premium');
const premiumWindow = document.getElementById('premium-window');
const closePremium = document.getElementById('close-premium');
const premiumUpgrade = document.getElementById('premium-upgrade');

if (openPremium) {
  openPremium.addEventListener('click', () => {
    if (!premiumWindow) return;
    premiumWindow.hidden = false;
    premiumWindow.style.display = 'flex';
    premiumWindow.classList.remove('hidden');
  });
}
if (closePremium) {
  closePremium.addEventListener('click', () => {
    premiumWindow.hidden = true;
    premiumWindow.style.display = 'none';
  });
}
if (premiumUpgrade) {
  premiumUpgrade.addEventListener('click', () => {
    premiumWindow.hidden = true;
    premiumWindow.style.display = 'none';
    openUpgrade();
  });
}
if (premiumWindow) {
  premiumWindow.addEventListener('click', (e) => {
    if (e.target === premiumWindow) {
      premiumWindow.hidden = true;
      premiumWindow.style.display = 'none';
    }
  });
}
const burger = document.getElementById('burger');
const mainNav = document.getElementById('main-nav');
if (burger && mainNav) {
  burger.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });
}

// Pricing popup from nav
const openPricing = document.getElementById('open-pricing');
if (openPricing) {
  openPricing.addEventListener('click', (e) => {
    e.preventDefault();
    openUpgrade();
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('upgrade-modal');
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
});

function openUpgrade() { 
  upgradeModal.hidden = false; 
  upgradeModal.style.display = 'flex';
  upgradeModal.classList.remove('hidden');
}

function closeUpgrade() { 
  upgradeModal.hidden = true; 
  upgradeModal.style.display = 'none';
  upgradeModal.classList.add('hidden');
}

// Wire buttons with forced close
if (upgradeFromPricing) upgradeFromPricing.addEventListener('click', (e) => { e.preventDefault(); openUpgrade(); });
if (upgradeFromLocked) upgradeFromLocked.addEventListener('click', (e) => { e.preventDefault(); openUpgrade(); });

const testPaidBtn = document.getElementById('test-paid');
const cancelBtn = document.getElementById('cancel-upgrade');

if (testPaidBtn) {
  testPaidBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    savePlan('monthly');
    closeUpgrade();
    setTimeout(() => {
      const el = document.getElementById('automated');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeUpgrade();
  });
}

// Click outside
upgradeModal.addEventListener('click', (e) => {
  if (e.target === upgradeModal) closeUpgrade();
});

// Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUpgrade();
});

// Plan options
document.querySelectorAll('.plan-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    savePlan(btn.dataset.plan);
    closeUpgrade();
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
  const listEl = document.getElementById('app-list');
  if (!listEl) return;
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
  const company = document.getElementById('company').value.trim();
  const role = document.getElementById('role').value.trim();
  const applied = document.getElementById('applied').value;

  if (!company || !role || !applied) {
    showToast('Please fill in Company, Role, and Date applied');
    return;
  }

  const apps = loadApps();
  apps.unshift({
    company,
    role,
    applied,
    source: document.getElementById('source').value
  });
  saveApps(apps);
  form.reset();
  document.getElementById('applied').valueAsDate = new Date();
  renderApps();
  showToast('Application saved');
});

// Human Signal + Video
const headlineEl = document.getElementById('headline');
const proofEl = document.getElementById('proof');
const previewEl = document.getElementById('signal-preview');
const saveSignalBtn = document.getElementById('save-signal');
const startRecordBtn = document.getElementById('start-record');
const stopRecordBtn = document.getElementById('stop-record');
const videoUpload = document.getElementById('video-upload');
const videoPreview = document.getElementById('video-preview');
const recordingStatus = document.getElementById('recording-status');
const clearVideoBtn = document.getElementById('clear-video');

let mediaRecorder = null;
let recordedChunks = [];
let currentVideoUrl = null;

function renderSignal() {
  const el = document.getElementById('signal-preview');
  if (!el) return;
  const data = loadSignal() || {};
  let html = '';
  if (data.headline) html += `<h4 style="margin:0 0 0.5rem 0;font-size:1.1rem;">${data.headline}</h4>`;
  if (data.proof) html += `<p style="margin:0 0 0.75rem 0;line-height:1.5;">${data.proof}</p>`;
  if (currentVideoUrl) {
    html += `<video src="${currentVideoUrl}" controls style="width:100%;max-height:180px;border-radius:8px;background:#000;margin-top:0.5rem;"></video>`;
  }
  el.innerHTML = html || '<p class="muted">Preview appears here.</p>';
}

function loadSignalIntoForm() {
  const data = loadSignal();
  if (data.headline) headlineEl.value = data.headline;
  if (data.proof) proofEl.value = data.proof;
  renderSignal();
}

function setVideo(url) {
  if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
  currentVideoUrl = url;
  if (url) {
    videoPreview.src = url;
    videoPreview.style.display = 'block';
    clearVideoBtn.hidden = false;
  } else {
    videoPreview.src = '';
    videoPreview.style.display = 'none';
    clearVideoBtn.hidden = true;
  }
  renderSignal();
}

startRecordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideo(url);
      stream.getTracks().forEach(track => track.stop());
      recordingStatus.textContent = 'Recording saved.';
      recordingStatus.classList.remove('recording');
    };
    mediaRecorder.start();
    startRecordBtn.hidden = true;
    stopRecordBtn.hidden = false;
    recordingStatus.textContent = 'Recording… click Stop when finished.';
    recordingStatus.classList.add('recording');
  } catch (err) {
    recordingStatus.textContent = 'Camera access denied or unavailable.';
  }
});

stopRecordBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  startRecordBtn.hidden = false;
  stopRecordBtn.hidden = true;
});

videoUpload.addEventListener('change', () => {
  const file = videoUpload.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    setVideo(url);
    recordingStatus.textContent = `Uploaded: ${file.name}`;
  }
});

clearVideoBtn.addEventListener('click', () => {
  setVideo(null);
  videoUpload.value = '';
  recordingStatus.textContent = '';
});

saveSignalBtn.addEventListener('click', () => {
  saveSignal({ headline: headlineEl.value.trim(), proof: proofEl.value.trim() });
  renderSignal();
  showToast('Human signal saved');
});

document.getElementById('reset-signal').addEventListener('click', () => {
  headlineEl.value = '';
  proofEl.value = '';
  setVideo(null);
  if (videoUpload) videoUpload.value = '';
  if (recordingStatus) recordingStatus.textContent = '';
  saveSignal({});
  renderSignal();
  showToast('Human signal reset');
});

// Resumes (up to 5)
const RESUMES_KEY = 'signalpath_resumes';
function loadResumes() { return loadJSON(RESUMES_KEY, []); }
function saveResumes(list) { saveJSON(RESUMES_KEY, list); }

const resumeNameInput = document.getElementById('resume-name');
const resumeFile = document.getElementById('resume-file');
const saveResumeBtn = document.getElementById('save-resume');
const resumeListEl = document.getElementById('resume-list');

function renderResumes() {
  const list = loadResumes();
  if (!resumeListEl) return;
  if (!list.length) {
    resumeListEl.innerHTML = '<p class="muted">No resumes saved yet.</p>';
    return;
  }
  resumeListEl.innerHTML = list.map((r, i) => `
    <div class="resume-item">
      <span><strong>${r.name}</strong> · ${r.filename}</span>
      <button data-index="${i}">Remove</button>
    </div>
  `).join('');
  resumeListEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const resumes = loadResumes();
      resumes.splice(Number(btn.dataset.index), 1);
      saveResumes(resumes);
      renderResumes();
      showToast('Resume removed');
    });
  });
}

if (saveResumeBtn) {
  saveResumeBtn.addEventListener('click', () => {
    const name = resumeNameInput.value.trim();
    const file = resumeFile.files[0];
    if (!name) {
      showToast('Name the resume for the job you’re applying to');
      return;
    }
    if (!file) {
      showToast('Choose a file first');
      return;
    }
    const resumes = loadResumes();
    if (resumes.length >= 5) {
      showToast('Maximum of 5 resumes. Remove one to add another.');
      return;
    }
    resumes.unshift({ name, filename: file.name, date: new Date().toISOString() });
    saveResumes(resumes);
    resumeNameInput.value = '';
    resumeFile.value = '';
    renderResumes();
    showToast('Resume saved');
  });
}
renderResumes();
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
  if (file) { 
    localStorage.setItem(RESUME_KEY, file.name); 
    loadResume(); 
    showToast('Resume uploaded');
  }
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
  if (loadPlan() === 'free') {
    showToast('Upgrade to use Automated features');
    return;
  }
  const company = document.getElementById('auto-company').value.trim();
  const role = document.getElementById('auto-role').value.trim();
  if (!company || !role) {
    showToast('Please enter Company and Role');
    return;
  }
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
  showToast('Delivery simulated and saved');
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

if (checkBtn && jobText && checkResult) {
  checkBtn.addEventListener('click', () => {
    const text = jobText.value.trim();
    if (!text) {
      showToast('Paste a job description first');
      checkResult.hidden = false;
      checkResult.innerHTML = '<p>Paste a job description first.</p>';
      return;
    }
    const r = analyzeJob(text);
    checkResult.hidden = false;
    checkResult.className = `result-box ${r.level}`;
    checkResult.innerHTML = `<strong>${r.label}</strong> (score: ${r.score})<ul style="margin-top:0.5rem;padding-left:1.2rem;">${r.flags.length ? r.flags.map(f => `<li>${f}</li>`).join('') : '<li>No strong red flags.</li>'}</ul><p class="muted" style="margin-top:0.5rem;">Pattern check only.</p>`;
    showToast('Legitimacy check complete');
  });
} else {
  console.warn('Job legitimacy check elements missing');
}

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
  showToast('Skills gap generated');
});

// Toast helper
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function updateDashboard() {
  try {
    const apps = loadApps();
    const signal = loadSignal();
    const resumeName = localStorage.getItem(RESUME_KEY);
    const plan = loadPlan();
    const auto = loadAuto();

    const appCount = document.getElementById('app-count');
    const signalStatus = document.getElementById('signal-status');
    const resumeStatus = document.getElementById('resume-status');
    const planStatus = document.getElementById('plan-status');
    const dashApps = document.getElementById('dash-apps');
    const dashSignal = document.getElementById('dash-signal');
    const dashTools = document.getElementById('dash-tools');

    if (appCount) appCount.textContent = apps.length;
    if (signalStatus) signalStatus.textContent = (signal.headline || signal.proof) ? 'Set' : 'Not set';
    if (resumeStatus) resumeStatus.textContent = resumeName ? 'Yes' : 'None';
    if (planStatus) planStatus.textContent = plan === 'free' ? 'Free' : plan.charAt(0).toUpperCase() + plan.slice(1);

    if (dashApps) {
      dashApps.innerHTML = apps.length
        ? apps.slice(0, 3).map(a => `<div class="dash-item"><strong>${a.role}</strong> at ${a.company}</div>`).join('')
        : '<span class="muted">None yet.</span>';
    }

    if (dashSignal) {
      dashSignal.innerHTML = (signal.headline || signal.proof)
        ? `<strong>${signal.headline || ''}</strong><p class="dash-sub">${signal.proof || ''}</p>`
        : '<span class="muted">Not set.</span>';
    }

    if (dashTools) {
      dashTools.innerHTML = auto.length
        ? `<strong>${auto[0].method}</strong><div class="muted dash-sub">${auto[0].company} — ${auto[0].role}</div>`
        : '<span class="muted">No checks run yet.</span>';
    }
    const atsCount = document.getElementById('ats-count');
    const signalStatus = document.getElementById('signal-status');
    const resumeStatus = document.getElementById('resume-status');
    const planStatus = document.getElementById('plan-status');
    const dashApps = document.getElementById('dash-apps');
    const dashAts = document.getElementById('dash-ats');
    const dashSignal = document.getElementById('dash-signal');
    const dashTools = document.getElementById('dash-tools');

    if (appCount) appCount.textContent = apps.length;
    const atsFlagged = auto.filter(item => item.badge === 'ats' || (item.method && item.method.toLowerCase().includes('ats')));
    if (atsCount) atsCount.textContent = atsFlagged.length;
    if (signalStatus) signalStatus.textContent = (signal.headline || signal.proof) ? 'Set' : 'Not set';
    if (resumeStatus) resumeStatus.textContent = resumeName ? 'Yes' : 'None';
    if (planStatus) planStatus.textContent = plan === 'free' ? 'Free' : plan.charAt(0).toUpperCase() + plan.slice(1);

    if (dashApps) {
      dashApps.innerHTML = apps.length
        ? apps.slice(0, 3).map(a => `<div class="dash-item"><strong>${a.role}</strong> at ${a.company}</div>`).join('')
        : '<span class="muted">None yet.</span>';
    }

    if (dashAts) {
      dashAts.innerHTML = atsFlagged.length
        ? atsFlagged.slice(0, 3).map(a => `<div class="dash-item"><strong>${a.role}</strong> at ${a.company}</div>`).join('')
        : '<span class="muted">None flagged.</span>';
    }

    if (dashSignal) {
      dashSignal.innerHTML = (signal.headline || signal.proof)
        ? `<strong>${signal.headline || ''}</strong><p class="dash-sub">${signal.proof || ''}</p>`
        : '<span class="muted">Not set.</span>';
    }

    if (dashTools) {
      dashTools.innerHTML = auto.length
        ? `<strong>${auto[0].method}</strong><div class="muted dash-sub">${auto[0].company} — ${auto[0].role}</div>`
        : '<span class="muted">No checks run yet.</span>';
    }
  } catch (e) {
    console.error('Dashboard update failed:', e);
  }
}

// Word check before submit
const wordcheckModal = document.getElementById('wordcheck-modal');
const wordcheckResults = document.getElementById('wordcheck-results');
const wordcheckStop = document.getElementById('wordcheck-stop');
const wordcheckContinue = document.getElementById('wordcheck-continue');

function extractKeywords(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stop = new Set(['with','that','this','from','have','been','will','your','they','their','about','which','would','there','these','those','other','into','more','some','such','than','then','also','only','just','like','over','after','before','between','through']);
  return [...new Set(words.filter(w => !stop.has(w)))].slice(0, 15);
}

function runWordCheck(resumeText, jobText) {
  const jobKeys = extractKeywords(jobText);
  const resumeLower = (resumeText || '').toLowerCase();
  return jobKeys.map(key => ({
    term: key,
    found: resumeLower.includes(key)
  }));
}

function showWordCheck(results, onContinue) {
  wordcheckResults.innerHTML = results.map(r => `
    <div class="wordcheck-item ${r.found ? 'found' : 'missing'}">
      <span>${r.term}</span>
      <span>${r.found ? 'In resume' : 'Missing'}</span>
    </div>
  `).join('') || '<p class="muted">No strong keywords found in the job description.</p>';
  wordcheckModal.hidden = false;
  wordcheckModal.style.display = 'flex';

  const stop = () => {
    closeWordCheck();
    showToast('Submission stopped. Revise and try again.');
  };
  const cont = () => {
    closeWordCheck();
    onContinue();
  };
  wordcheckStop.onclick = stop;
  wordcheckContinue.onclick = cont;
}
function closeWordCheck() {
  wordcheckModal.hidden = true;
  wordcheckModal.style.display = 'none';
}

// Hook into application form submit
const originalAppSubmit = form.onsubmit;
form.addEventListener('submit', (e) => {
  // The existing handler already runs; we intercept after validation by wrapping logic below if needed.
}, true);

// Replace the existing submit handler to include word check
form.removeEventListener('submit', form._submitHandler);
form._submitHandler = (e) => {
  e.preventDefault();
  const company = document.getElementById('company').value.trim();
  const role = document.getElementById('role').value.trim();
  const applied = document.getElementById('applied').value;
  if (!company || !role || !applied) {
    showToast('Please fill in Company, Role, and Date applied');
    return;
  }

  const resumeText = (document.getElementById('headline')?.value || '') + ' ' + (document.getElementById('proof')?.value || '');
  const jobText = document.getElementById('job-text')?.value || '';
  const results = runWordCheck(resumeText, jobText);

  const doSubmit = () => {
    const apps = loadApps();
    apps.unshift({
      company,
      role,
      applied,
      source: document.getElementById('source').value
    });
    saveApps(apps);
    form.reset();
    document.getElementById('applied').valueAsDate = new Date();
    renderApps();
    showToast('Application saved');
  };

  if (jobText.trim()) {
    showWordCheck(results, doSubmit);
  } else {
    doSubmit();
  }
};
form.addEventListener('submit', form._submitHandler);
const openResumeBuilder = document.getElementById('open-resume-builder');
const resumeBuilderModal = document.getElementById('resume-builder-modal');
const closeResumeBuilder = document.getElementById('close-resume-builder');
const resumeBuilderForm = document.getElementById('resume-builder-form');
const resumeOutput = document.getElementById('resume-output');

function openResumeBuilderModal() {
  if (loadPlan() === 'free') {
    showToast('Upgrade to build a resume with AI');
    openUpgrade();
    return;
  }
  resumeBuilderModal.hidden = false;
  resumeBuilderModal.style.display = 'flex';
}
function closeResumeBuilderModal() {
  resumeBuilderModal.hidden = true;
  resumeBuilderModal.style.display = 'none';
}
if (openResumeBuilder) openResumeBuilder.addEventListener('click', openResumeBuilderModal);
if (closeResumeBuilder) closeResumeBuilder.addEventListener('click', closeResumeBuilderModal);
if (resumeBuilderModal) {
  resumeBuilderModal.addEventListener('click', (e) => {
    if (e.target === resumeBuilderModal) closeResumeBuilderModal();
  });
}

if (resumeBuilderForm) {
  resumeBuilderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loadPlan() === 'free') {
      showToast('Upgrade to generate a resume');
      openUpgrade();
      return;
    }
    const name = document.getElementById('rb-name').value.trim();
    const email = document.getElementById('rb-email').value.trim();
    const phone = document.getElementById('rb-phone').value.trim();
    const location = document.getElementById('rb-location').value.trim();
    const summary = document.getElementById('rb-summary').value.trim();
    const experience = document.getElementById('rb-experience').value.trim();
    const education = document.getElementById('rb-education').value.trim();
    const skills = document.getElementById('rb-skills').value.trim();
    const jobdesc = document.getElementById('rb-jobdesc').value.trim();

    const tailored = jobdesc ? `\n\nTAILORED FOR JOB\nKey themes from the job description have been considered in the wording above.` : '';
    const cv = `
════════════════════════════════════════
                    CURRICULUM VITAE
════════════════════════════════════════

${name}
${[email, phone, location].filter(Boolean).join('  |  ')}

────────────────────────────────────────
PROFESSIONAL SUMMARY
────────────────────────────────────────
${summary || 'Results-oriented professional with a track record of delivering measurable outcomes.'}

────────────────────────────────────────
PROFESSIONAL EXPERIENCE
────────────────────────────────────────
${experience || 'Relevant experience details will appear here.'}

────────────────────────────────────────
EDUCATION
────────────────────────────────────────
${education || 'Education details will appear here.'}

────────────────────────────────────────
CORE SKILLS
────────────────────────────────────────
${skills || 'Key skills will appear here.'}${tailored}
    `.trim();

    resumeOutput.hidden = false;
    resumeOutput.innerHTML = `<h4>Generated CV</h4><pre class="cv-pre">${cv}</pre><p class="muted" style="margin-top:0.75rem;">Simulated AI CV for demo. A real version would use an AI API and allow download as PDF/DOCX.</p>`;
    showToast('CV generated');
  });
}
function init() {
  updateAuthUI();
  renderApps();
  loadSignalIntoForm();
  loadResume();
  updateDashboard();
  document.getElementById('applied').valueAsDate = new Date();
}
init();