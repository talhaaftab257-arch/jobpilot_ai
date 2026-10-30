const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');
const files = [
  'pages/WelcomeScreen.tsx',
  'pages/JobDetails.tsx',
  'pages/AIAssistant.tsx',
  'pages/SavedJobs.tsx',
  'pages/MatchedJobs.tsx',
  'pages/JobPortal.tsx',
  'pages/Billing.tsx',
  'pages/CrmDashboard.tsx',
  'pages/Workspace.tsx',
  'components/common/JobPilotLogo.tsx',
];

function transform(src) {
  let s = src;

  // Tiny sizes -> caption
  s = s.replace(/\btext-\[9px\]/g, 'type-caption');
  s = s.replace(/\btext-\[10px\]/g, 'type-caption');
  s = s.replace(/\btext-\[11px\]/g, 'type-caption');

  // WelcomeScreen custom sizes
  s = s.replace(
    /\btext-\[17px\] sm:text-lg font-black tracking-tight\b/g,
    'type-h3 tracking-tight'
  );
  s = s.replace(
    /\btext-\[24px\] sm:text-\[26px\] font-bold tracking-tight text-white leading-\[1\.25\]\b/g,
    'type-h1 tracking-tight text-white'
  );
  s = s.replace(/\btext-\[12px\] sm:text-\[13px\]\b/g, 'type-small');

  // Prices / KPIs
  s = s.replace(/\btext-3xl sm:text-4xl font-black\b/g, 'type-h1');
  s = s.replace(/\btext-2xl sm:text-3xl font-black\b/g, 'type-h1');
  s = s.replace(/\btext-3xl font-black\b/g, 'type-h1');
  s = s.replace(/\btext-xl sm:text-2xl font-extrabold\b/g, 'type-h2');
  s = s.replace(/\btext-2xl font-extrabold\b/g, 'type-h1');
  s = s.replace(/\btext-2xl font-black\b/g, 'type-h1');
  s = s.replace(/\btext-lg sm:text-xl font-bold\b/g, 'TYPE_H_PLACEHOLDER');
  s = s.replace(/\btext-lg font-bold\b/g, 'type-h3');
  s = s.replace(/\btext-xl sm:text-2xl font-bold\b/g, 'type-h1');
  s = s.replace(/\btext-xl font-extrabold\b/g, 'type-h2');
  s = s.replace(/\btext-xl font-bold\b/g, 'type-h2');
  s = s.replace(/\btext-2xl font-bold\b/g, 'type-h1');

  // Restore placeholder: decide h2 vs h3 by tag context in a second pass
  // Temporarily keep as type-h3 for cards; section h2 tags get upgraded below
  s = s.replace(/TYPE_H_PLACEHOLDER/g, 'type-h3');

  // Page / section / card headings by tag
  s = s.replace(
    /<h1 className="text-xl sm:text-2xl font-bold /g,
    '<h1 className="type-h1 '
  );
  s = s.replace(/<h1 className="text-2xl font-bold /g, '<h1 className="type-h1 ');
  s = s.replace(
    /<h2 className="text-2xl font-extrabold /g,
    '<h2 className="type-h1 '
  );
  s = s.replace(/<h2 className="text-xl font-bold /g, '<h2 className="type-h2 ');
  s = s.replace(/<h2 className="text-base font-bold /g, '<h2 className="type-h2 ');
  s = s.replace(/<h2 className="type-h3 /g, '<h2 className="type-h2 ');

  s = s.replace(
    /<h3 className="text-base font-extrabold /g,
    '<h3 className="type-h3 '
  );
  s = s.replace(/<h3 className="text-base font-bold /g, '<h3 className="type-h3 ');
  s = s.replace(/<h3 className="font-bold text-base /g, '<h3 className="type-h3 ');
  s = s.replace(
    /<h3 className="font-extrabold text-sm /g,
    '<h3 className="type-h3 '
  );
  s = s.replace(/<h3 className="text-sm font-bold /g, '<h3 className="type-h3 ');
  s = s.replace(/<h3 className="type-h2 /g, '<h3 className="type-h3 ');
  s = s.replace(/<h3 className="font-bold text-base /g, '<h3 className="type-h3 ');

  // MatchedJobs card title pattern
  s = s.replace(
    /<h3 className="font-bold text-base /g,
    '<h3 className="type-h3 '
  );

  // text-base / text-xs / text-sm
  s = s.replace(/\btext-base\b/g, 'type-body');
  s = s.replace(/\btext-xs\b/g, 'type-small');
  s = s.replace(/\btext-sm\b/g, 'type-body');

  // JobDetails match score KPI
  s = s.replace(/\btext-2xl font-black\b/g, 'type-h1');
  s = s.replace(
    /<span className="type-h1 text-\[#171717\]">\{score\}%<\/span>/g,
    '<span className="type-h1 text-[#171717] font-tabular">{score}%</span>'
  );

  // MatchedJobs score badge that was text-sm font-black
  s = s.replace(/\btype-body font-black\b/g, 'type-h3 font-tabular');
  s = s.replace(/\btype-body font-extrabold\b/g, 'type-body font-bold');

  // Deduplicate
  s = s.replace(/\btype-body type-body\b/g, 'type-body');
  s = s.replace(/\btype-h1 type-h1\b/g, 'type-h1');
  s = s.replace(/\btype-h2 type-h2\b/g, 'type-h2');
  s = s.replace(/\btype-h3 type-h3\b/g, 'type-h3');
  s = s.replace(/\btype-small type-small\b/g, 'type-small');
  s = s.replace(/\btype-caption type-caption\b/g, 'type-caption');

  // Strip redundant weights on heading tokens (token already sets weight)
  s = s.replace(/\btype-h1\s+font-(?:black|extrabold|bold)\b/g, 'type-h1');
  s = s.replace(/\bfont-(?:black|extrabold|bold)\s+type-h1\b/g, 'type-h1');
  s = s.replace(/\btype-h2\s+font-(?:black|extrabold|bold)\b/g, 'type-h2');
  s = s.replace(/\bfont-(?:black|extrabold|bold)\s+type-h2\b/g, 'type-h2');
  s = s.replace(/\btype-h3\s+font-(?:black|extrabold|bold)\b/g, 'type-h3');
  s = s.replace(/\bfont-(?:black|extrabold|bold)\s+type-h3\b/g, 'type-h3');

  // Clean className whitespace
  s = s.replace(/className="([^"]*)"/g, (_, cls) => {
    return 'className="' + cls.replace(/\s{2,}/g, ' ').trim() + '"';
  });
  s = s.replace(/className=\{`([^`]*)`\}/g, (_, cls) => {
    return 'className={`' + cls.replace(/\s{2,}/g, ' ').trim() + '`}';
  });

  return s;
}

const changed = [];
for (const f of files) {
  const full = path.join(base, f);
  const before = fs.readFileSync(full, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(full, after);
    changed.push(f);
  }
}
console.log('Changed:');
console.log(changed.join('\n') || '(none)');
