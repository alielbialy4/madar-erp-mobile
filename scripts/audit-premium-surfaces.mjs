import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

function walk(dir, predicate = () => true) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(absolute, predicate);
    return predicate(absolute) ? [absolute] : [];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function lineAt(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function domainFor(sourcePath, route = '') {
  const normalized = `${sourcePath}/${route}`.toLowerCase();
  const domains = [
    ['pos', ['pos', 'payment', 'cashmovement', 'holdcart', 'modifier', 'variant']],
    ['sales', ['sale', 'refund', 'layaway', 'billsplit']],
    ['inventory', ['inventory', 'stock', 'warehouse', 'reorder', 'requisition']],
    ['purchases', ['purchase']],
    ['suppliers', ['supplier']],
    ['customers', ['customer']],
    ['dining', ['dining', 'tableorder', 'waiter']],
    ['kitchen', ['kitchen']],
    ['delivery', ['delivery', 'driver']],
    ['finance', ['vault', 'financialaccount', 'paymentledger', 'budget', 'expense', 'shift']],
    ['reports', ['report']],
    ['products', ['product', 'categor', 'coupon', 'promotion', 'giftcard', 'barcode']],
    ['settings', ['setting', 'user', 'role', 'branch', 'tenant', 'profile', 'activity', 'backup', 'sync', 'printer', 'printqueue']],
    ['dashboard', ['dashboard']],
    ['auth', ['login', 'auth']],
    ['notifications', ['notification']],
  ];
  return domains.find(([, needles]) => needles.some((needle) => normalized.includes(needle)))?.[0] ?? 'shared';
}

function screenTypeFor(route, sourcePath) {
  const name = `${route}/${sourcePath}`.toLowerCase();
  if (/login|auth/.test(name)) return 'FORM';
  if (/dashboard|morehome/.test(name)) return 'CONTROL_CENTER';
  if (/poshome|waiterpos|kitchen(order)?screen|shiftmanagement|tableorderscreen/.test(name)) return 'OPERATIONAL';
  if (/form|create|edit/.test(name)) return 'FORM';
  if (/detail|insight|statement/.test(name)) return 'DETAIL';
  if (/report|ledger/.test(name)) return 'REPORT';
  if (/list|home|screen/.test(name)) return 'LIST';
  return 'SCREEN';
}

function goalFor(type, domain) {
  const label = domain === 'shared' ? 'module data' : domain;
  switch (type) {
    case 'CONTROL_CENTER': return `Understand current ${label} state and exceptions`;
    case 'OPERATIONAL': return `Complete time-sensitive ${label} work safely`;
    case 'FORM': return `Create or update ${label} data with confidence`;
    case 'DETAIL': return `Understand one ${label} record and take the next action`;
    case 'REPORT': return `Analyze scoped ${label} performance and drill into evidence`;
    case 'LIST': return `Find, scan, filter, and act on ${label} records`;
    default: return `Complete the primary ${label} task`;
  }
}

function primaryActionFor(type) {
  switch (type) {
    case 'FORM': return 'Save / submit';
    case 'LIST': return 'Open or create record';
    case 'DETAIL': return 'Contextual record action';
    case 'REPORT': return 'Change scope / inspect breakdown';
    case 'CONTROL_CENTER': return 'Resolve priority exception';
    case 'OPERATIONAL': return 'Advance operational state';
    default: return 'Contextual action';
  }
}

function densityFor(type) {
  if (['LIST', 'REPORT', 'OPERATIONAL'].includes(type)) return 'DENSE';
  if (type === 'FORM') return 'COMFORTABLE';
  return 'STANDARD';
}

function riskFor(domain, type, route) {
  const value = `${domain}/${type}/${route}`.toLowerCase();
  if (/payment|refund|shift|finance|vault|expense|stock|purchase|pos/.test(value)) return 'HIGH';
  if (/settings|user|role|branch|delivery|kitchen/.test(value)) return 'MEDIUM';
  return 'LOW';
}

function baselineScores(type, risk) {
  if (risk === 'HIGH') return { ux: 4.0, visual: 3.5 };
  if (['REPORT', 'OPERATIONAL'].includes(type)) return { ux: 4.5, visual: 4.0 };
  if (type === 'FORM') return { ux: 4.5, visual: 4.0 };
  return { ux: 5.0, visual: 4.5 };
}

function featureCounts(source) {
  const count = (pattern) => (source.match(pattern) ?? []).length;
  return {
    forms: count(/\b(?:useForm|AppInput|TextField|MoneyField|SelectField)\b/g),
    filters: count(/\b(?:Filter|Search|DateRange)\w*/g),
    lists: count(/\b(?:FlatList|SectionList|ResourceList|AppListItem|DataRow)\b/g),
    metrics: count(/\b(?:Kpi|Metric|Stat|Summary)\w*/g),
    charts: count(/\b(?:Chart|PieChart|BarChart|LineChart)\b/g),
    modals: count(/<\w*(?:Sheet|Modal|Dialog)\b/g),
  };
}

const allTsx = walk(SRC, (file) => file.endsWith('.tsx'));
const sourceByPath = new Map(allTsx.map((file) => [relative(file), fs.readFileSync(file, 'utf8')]));
const navigationFiles = walk(path.join(SRC, 'navigation'), (file) => file.endsWith('.tsx'));
const routes = [];

for (const file of navigationFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const importMap = new Map();
  const importPattern = /import\s+\{([^}]+)\}\s+from\s+['"](@\/[^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    const importPath = match[2].replace('@/', 'src/');
    for (const rawName of match[1].split(',')) {
      const [original, alias] = rawName.trim().split(/\s+as\s+/);
      if (original) importMap.set(alias ?? original, `${importPath}.tsx`);
    }
  }

  const routePattern = /<(Stack|Tab)\.Screen\b([\s\S]*?)\/>/g;
  for (const match of source.matchAll(routePattern)) {
    const attrs = match[2];
    const route = /name=['"]([^'"]+)['"]/.exec(attrs)?.[1];
    if (!route) continue;
    const componentExpression = /component=\{([^}]+)\}/.exec(attrs)?.[1] ?? '';
    const identifiers = componentExpression.match(/\b[A-Z][A-Za-z0-9_]*/g) ?? [];
    const component = identifiers.find((name) => importMap.has(name)) ?? identifiers.at(-1) ?? 'Unknown';
    const sourcePath = importMap.get(component) ?? relative(file);
    const screenSource = sourceByPath.get(sourcePath) ?? '';
    const screenType = screenTypeFor(route, sourcePath);
    const domain = domainFor(sourcePath, route);
    const risk = riskFor(domain, screenType, route);
    const scores = baselineScores(screenType, risk);
    routes.push({
      id: `ROUTE-${path.basename(file, '.tsx').toUpperCase()}-${route}`,
      navigator: path.basename(file, '.tsx'),
      route,
      component,
      source: sourcePath,
      domain,
      screenType,
      primaryGoal: goalFor(screenType, domain),
      primaryAction: primaryActionFor(screenType),
      secondaryActions: 'Search / filter / contextual actions where available',
      density: densityFor(screenType),
      ...featureCounts(screenSource),
      darkMode: /useColors\(|createStyles\(/.test(screenSource) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      rtl: /textStart|flexRow|screenRtl|rtl|writingDirection/.test(screenSource) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      phone: 'REQUIRES_VISUAL_QA',
      tablet: /useWindowDimensions|isTablet|tablet/i.test(screenSource) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      currentUxScore: scores.ux,
      currentVisualScore: scores.visual,
      risk,
      redesignStatus: 'BASELINED_NOT_REBUILT',
    });
  }
}

const overlayUsages = [];
const overlayPattern = /<(\w*(?:Sheet|Modal|Dialog))\b/g;
for (const [sourcePath, source] of sourceByPath) {
  for (const match of source.matchAll(overlayPattern)) {
    const component = match[1];
    if (component === 'StyleSheet') continue;
    const domain = domainFor(sourcePath, component);
    const risk = riskFor(domain, 'OVERLAY', component);
    const scores = baselineScores('OPERATIONAL', risk);
    overlayUsages.push({
      id: `OVERLAY-${sourcePath.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase()}-${lineAt(source, match.index ?? 0)}`,
      route: `${sourcePath}#L${lineAt(source, match.index ?? 0)}`,
      component,
      source: sourcePath,
      domain,
      screenType: 'OVERLAY',
      primaryGoal: `Complete a focused ${domain} decision without losing context`,
      primaryAction: /Confirm|Payment|Close|Open|Create|Edit/.test(component) ? 'Confirm focused action' : 'Choose and apply',
      secondaryActions: 'Cancel / dismiss',
      density: 'COMFORTABLE',
      ...featureCounts(source),
      darkMode: /useColors\(|createStyles\(/.test(source) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      rtl: /textStart|flexRow|rtl|writingDirection/.test(source) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      phone: 'REQUIRES_VISUAL_QA',
      tablet: /useWindowDimensions|isTablet|tablet/i.test(source) ? 'CODE_AWARE' : 'REVIEW_REQUIRED',
      currentUxScore: scores.ux,
      currentVisualScore: scores.visual,
      risk,
      redesignStatus: 'BASELINED_NOT_REBUILT',
    });
  }
}

const registeredSources = new Set(routes.map((item) => item.source));
const screenFiles = [...sourceByPath.keys()].filter((file) => file.startsWith('src/screens/') && /Screen\.tsx$/.test(file));
const unregisteredScreens = screenFiles.filter((file) => !registeredSources.has(file));
const reportDefinitionsPath = path.join(SRC, 'reports', 'reportDefinitions.ts');
const reportDefinitionsSource = fs.existsSync(reportDefinitionsPath) ? fs.readFileSync(reportDefinitionsPath, 'utf8') : '';
const reportDefinitionCount = (reportDefinitionsSource.match(/\bid:\s*['"]/g) ?? []).length;

const counts = {
  routeRegistrations: routes.length,
  uniqueRouteNames: new Set(routes.map((item) => item.route)).size,
  uniqueRegisteredScreenSources: registeredSources.size,
  screenFiles: screenFiles.length,
  unregisteredScreenFiles: unregisteredScreens.length,
  overlayUsages: overlayUsages.length,
  forms: routes.filter((item) => item.screenType === 'FORM').length,
  lists: routes.filter((item) => item.screenType === 'LIST').length,
  details: routes.filter((item) => item.screenType === 'DETAIL').length,
  reports: routes.filter((item) => item.screenType === 'REPORT').length,
  operational: routes.filter((item) => item.screenType === 'OPERATIONAL').length,
  reportDefinitions: reportDefinitionCount,
  sourceFilesWithHardcodedHex: [...sourceByPath.entries()].filter(([, source]) => /#[0-9A-Fa-f]{6}\b/.test(source)).length,
};

const output = {
  generatedAt: new Date().toISOString(),
  counts,
  routes: routes.sort((a, b) => `${a.domain}/${a.route}`.localeCompare(`${b.domain}/${b.route}`)),
  overlays: overlayUsages.sort((a, b) => a.route.localeCompare(b.route)),
  unregisteredScreens,
};

if (process.argv.includes('--markdown')) {
  const header = '| Screen ID | Route / surface | Source | Domain | Type | Primary goal | Primary action | Secondary actions | Density | Forms | Filters | Lists | Metrics | Charts | Modals | Dark | RTL | Phone | Tablet | UX | Visual | Risk | Status |';
  const divider = `|${'---|'.repeat(23)}`;
  const rows = [...output.routes, ...output.overlays].map((item) =>
    `| ${item.id} | ${item.route} | ${item.source} | ${item.domain} | ${item.screenType} | ${item.primaryGoal} | ${item.primaryAction} | ${item.secondaryActions} | ${item.density} | ${item.forms} | ${item.filters} | ${item.lists} | ${item.metrics} | ${item.charts} | ${item.modals} | ${item.darkMode} | ${item.rtl} | ${item.phone} | ${item.tablet} | ${item.currentUxScore} | ${item.currentVisualScore} | ${item.risk} | ${item.redesignStatus} |`,
  );
  console.log([header, divider, ...rows].join('\n'));
} else {
  console.log(JSON.stringify(output, null, 2));
}
