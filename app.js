// =============================================================
// Recruiting Match Tool — app.js
// Keyword-based scoring engine + client email generator
// =============================================================

// ---------------------------------------------------------------
// KEYWORD BANKS
// ---------------------------------------------------------------
const PRACTICE_AREA_KEYWORDS = [
  'insurance defense', 'workers comp', 'workers compensation',
  'personal injury', 'litigation', 'real estate', 'transactional',
  'corporate', 'employment', 'family law', 'immigration', 'bankruptcy',
  'intellectual property', 'securities', 'mergers', 'acquisitions',
  'construction', 'medical malpractice', 'product liability',
  'commercial litigation', 'civil defense', 'plaintiff'
];

const SENIORITY_MAP = {
  partner: 5,
  'senior associate': 4,
  'senior counsel': 4,
  counsel: 3.5,
  associate: 3,
  'junior associate': 2,
  paralegal: 1,
  'law clerk': 1
};

const RISK_PATTERNS = [
  { pattern: /relocat/i,       flag: 'Candidate may require relocation — confirm availability.' },
  { pattern: /currently unempl|unemployed|laid off/i, flag: 'Candidate is currently unemployed — probe gap.' },
  { pattern: /counter ?offer/i, flag: 'Candidate mentioned counteroffers — retention risk.' },
  { pattern: /multiple offer/i, flag: 'Candidate has multiple offers in play — act quickly.' },
  { pattern: /salary.{0,30}(high|above|more than|exceed)/i, flag: 'Salary expectations may exceed budget — verify.' },
  { pattern: /(1|one) year.{0,20}(left|each|tenure|firm)/i, flag: 'Short tenure pattern detected — possible job hopper.' },
  { pattern: /not (currently |actively )?look/i, flag: 'Candidate is passive — may need motivation.' },
  { pattern: /noncompete|non-compete|restrictive covenant/i, flag: 'Possible non-compete or restrictive covenant — review agreement.' },
  { pattern: /visa|h1b|sponsorship|work authori/i, flag: 'Visa/work authorization may be required — confirm.' }
];

// ---------------------------------------------------------------
// MAIN EVALUATE FUNCTION
// ---------------------------------------------------------------
function evaluateMatch() {
  const firmName        = document.getElementById('firmName').value.trim();
  const roleTitle       = document.getElementById('roleTitle').value.trim();
  const roleDescription = document.getElementById('roleDescription').value.trim();
  const candidateName   = document.getElementById('candidateName').value.trim();
  const resumeText      = document.getElementById('resumeText').value.trim();
  const screenNotes     = document.getElementById('screenNotes').value.trim();

  if (!roleDescription || !resumeText) {
    alert('Please enter at least a Job Description and Resume Text before evaluating.');
    return;
  }

  const roleText      = (roleDescription).toLowerCase();
  const candidateText = (resumeText + ' ' + screenNotes).toLowerCase();

  // --- 1. Skills Match ---
  const roleWords      = extractKeywords(roleText);
  const candidateWords = extractKeywords(candidateText);
  const overlap        = roleWords.filter(w => candidateWords.includes(w));
  const skillsScore    = Math.min(100, Math.round((overlap.length / Math.max(roleWords.length, 1)) * 160));

  // --- 2. Experience Level ---
  const yearsMatch  = candidateText.match(/(\d+)\+?\s*years?/g);
  const roleYears   = roleText.match(/(\d+)\+?\s*years?/g);
  const cYears      = yearsMatch  ? parseInt(yearsMatch[0])  : 0;
  const rYears      = roleYears   ? parseInt(roleYears[0])   : 0;
  let experienceScore = 70;
  if (rYears > 0) {
    const diff = cYears - rYears;
    if (diff >= 0 && diff <= 3) experienceScore = 92;
    else if (diff > 3)          experienceScore = 78;
    else if (diff === -1)       experienceScore = 65;
    else                        experienceScore = 45;
  }

  // --- 3. Practice Area Fit ---
  const rolePractices      = PRACTICE_AREA_KEYWORDS.filter(k => roleText.includes(k));
  const candidatePractices = PRACTICE_AREA_KEYWORDS.filter(k => candidateText.includes(k));
  const practiceOverlap    = rolePractices.filter(k => candidatePractices.includes(k));
  let practiceScore = rolePractices.length === 0 ? 70
    : Math.min(100, Math.round((practiceOverlap.length / rolePractices.length) * 100));

  // --- 4. Seniority Alignment ---
  let roleSeniority  = 0;
  let candSeniority  = 0;
  for (const [title, level] of Object.entries(SENIORITY_MAP)) {
    if (roleText.includes(title))      roleSeniority  = Math.max(roleSeniority,  level);
    if (candidateText.includes(title)) candSeniority  = Math.max(candSeniority, level);
  }
  let seniorityScore = 70;
  if (roleSeniority > 0 && candSeniority > 0) {
    const gap = Math.abs(roleSeniority - candSeniority);
    if (gap === 0)    seniorityScore = 95;
    else if (gap < 1) seniorityScore = 82;
    else if (gap < 2) seniorityScore = 62;
    else              seniorityScore = 40;
  }

  // --- 5. Culture / Environment Fit ---
  const cultureTerms = ['biglaw', 'boutique', 'plaintiff', 'defense', 'remote', 'hybrid',
    'in-office', 'fast-paced', 'collaborative', 'entrepreneurial', 'growing firm'];
  const roleCulture  = cultureTerms.filter(t => roleText.includes(t));
  const candCulture  = cultureTerms.filter(t => candidateText.includes(t));
  const cultOverlap  = roleCulture.filter(t => candCulture.includes(t));
  let cultureScore   = roleCulture.length === 0 ? 72
    : Math.min(100, Math.round((cultOverlap.length / roleCulture.length) * 100) + 30);
  cultureScore = Math.min(cultureScore, 100);

  // --- Overall Score ---
  const overall = Math.round(
    (skillsScore * 0.30) +
    (experienceScore * 0.25) +
    (practiceScore * 0.25) +
    (seniorityScore * 0.10) +
    (cultureScore * 0.10)
  );

  // --- Risk Flags ---
  const flags = [];
  RISK_PATTERNS.forEach(({ pattern, flag }) => {
    if (pattern.test(resumeText + ' ' + screenNotes)) flags.push(flag);
  });

  // --- Recommendation ---
  let recommendation, colorClass;
  if (overall >= 75) {
    recommendation = 'Strong Match — Recommend to Client';
    colorClass = 'strong';
  } else if (overall >= 55) {
    recommendation = 'Possible Match — Consider with Caveats';
    colorClass = 'possible';
  } else {
    recommendation = 'Weak Match — Not Recommended at This Time';
    colorClass = 'weak';
  }

  // --- Render ---
  renderResults({
    overall, skillsScore, experienceScore, practiceScore, seniorityScore, cultureScore,
    recommendation, colorClass, flags,
    firmName, roleTitle, candidateName,
    practiceOverlap, overlap
  });

  // --- Email ---
  const email = generateEmail({
    firmName, roleTitle, candidateName,
    overall, recommendation, practiceOverlap, overlap,
    flags, screenNotes
  });
  document.getElementById('emailDraft').value = email;
}

// ---------------------------------------------------------------
// RENDER RESULTS
// ---------------------------------------------------------------
function renderResults(data) {
  const r = document.getElementById('results');
  r.classList.remove('hidden');

  const circle = document.getElementById('overallScore');
  circle.textContent = data.overall + '%';
  circle.className = 'score-circle ' + data.colorClass;

  document.getElementById('recommendation').textContent = data.recommendation;

  setBar('Skills',      data.skillsScore);
  setBar('Experience',  data.experienceScore);
  setBar('Practice',    data.practiceScore);
  setBar('Seniority',   data.seniorityScore);
  setBar('Culture',     data.cultureScore);

  const flagList = document.getElementById('riskFlags');
  flagList.innerHTML = '';
  if (data.flags.length === 0) {
    flagList.innerHTML = '<li style="color:#27ae60">No major risk flags detected.</li>';
  } else {
    data.flags.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      flagList.appendChild(li);
    });
  }

  r.scrollIntoView({ behavior: 'smooth' });
}

function setBar(name, score) {
  const bar   = document.getElementById('bar' + name);
  const label = document.getElementById('score' + name);
  if (bar)   bar.style.width   = score + '%';
  if (label) label.textContent = score + '%';
}

// ---------------------------------------------------------------
// EMAIL GENERATOR
// ---------------------------------------------------------------
function generateEmail({ firmName, roleTitle, candidateName, overall, recommendation,
  practiceOverlap, overlap, flags, screenNotes }) {

  const firm      = firmName      || 'your firm';
  const role      = roleTitle     || 'the role';
  const candidate = candidateName || 'the candidate';

  const strengthLine = practiceOverlap.length > 0
    ? `Their background includes experience in ${practiceOverlap.slice(0, 2).join(' and ')}, which aligns well with the needs of this role.`
    : overlap.length > 0
      ? `Their background aligns with several key requirements of the role, including experience in areas such as ${overlap.slice(0, 3).join(', ')}.`
      : 'Their background reflects a broad range of relevant legal experience.';

  const matchLine = overall >= 75
    ? `Based on our screening, we believe ${candidate} is a strong match for the ${role} position at ${firm}.`
    : overall >= 55
      ? `Based on our screening, we believe ${candidate} is a potential fit for the ${role} position at ${firm}, with a few areas worth discussing further.`
      : `We wanted to bring ${candidate} to your attention for consideration for the ${role} role at ${firm}, though there are some areas we would like to discuss with you.`;

  const flagLine = flags.length > 0
    ? ` Please note there are a couple of items we would like to walk through with you on a brief call.`
    : ' We are happy to arrange an introduction at your convenience.';

  const closingLine = `We look forward to your thoughts and are available to discuss further at your earliest convenience.`;

  return `${matchLine} ${strengthLine}${flagLine} ${closingLine}`;
}

// ---------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------
function extractKeywords(text) {
  const stopwords = new Set([
    'the','and','for','with','that','this','have','from','will','our',
    'are','was','has','been','they','their','which','also','more','than',
    'into','can','its','your','you','we','be','an','of','in','to','a',
    'is','or','on','at','by','as','not','but','if','it','he','she'
  ]);
  return [...new Set(
    text.replace(/[^a-z0-9\s\-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w))
  )];
}

function copyEmail() {
  const el = document.getElementById('emailDraft');
  el.select();
  document.execCommand('copy');
  const btn = document.querySelector('.copy-btn');
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = orig, 2000);
}

function clearAll() {
  ['firmName','roleTitle','roleDescription','candidateName','resumeText','screenNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('results').classList.add('hidden');
}

function loadSample() {
  fetch('sample-data.json')
    .then(r => r.json())
    .then(data => {
      document.getElementById('firmName').value        = data.firmName;
      document.getElementById('roleTitle').value       = data.roleTitle;
      document.getElementById('roleDescription').value = data.roleDescription;
      document.getElementById('candidateName').value   = data.candidateName;
      document.getElementById('resumeText').value      = data.resumeText;
      document.getElementById('screenNotes').value     = data.screenNotes;
    })
    .catch(() => alert('Could not load sample-data.json. Make sure it exists in the same folder.'));
}
