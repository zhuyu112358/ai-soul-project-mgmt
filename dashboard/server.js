// Sojourn Project Management Dashboard
// 凌栖/Sojourn项目管理仪表盘后端
// Port: 3001 (Ember server uses 3000)

const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Project root - all repos under D:\Sojourn
const ROOT = 'D:\\Sojourn';
const REPOS = {
  ember: path.join(ROOT, 'ember'),
  arboreus: path.join(ROOT, 'arboreus'),
  battleplan: path.join(ROOT, 'battleplan'),
  management: path.join(ROOT, 'management')
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper: run git command in repo
function gitCmd(repo, cmd) {
  try {
    return execSync(`git -C "${repo}" ${cmd}`, { encoding: 'utf8', timeout: 10000 }).trim();
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// Helper: read file safely
function readFileSafe(filePath, maxLen = 8000) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.length > maxLen ? content.substring(0, maxLen) + '\n...(truncated)' : content;
  } catch (e) {
    return null;
  }
}

// Helper: count files in directory by extension
function countFiles(dir, extensions) {
  let count = 0;
  try {
    if (!fs.existsSync(dir)) return 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      if (f.isFile()) {
        if (!extensions || extensions.some(ext => f.name.toLowerCase().endsWith(ext))) {
          count++;
        }
      } else if (f.isDirectory()) {
        count += countFiles(path.join(dir, f.name), extensions);
      }
    }
  } catch (e) { /* ignore */ }
  return count;
}

// ============= API Endpoints =============

// Overview - all key metrics in one call
app.get('/api/overview', (req, res) => {
  const data = {
    timestamp: new Date().toISOString(),
    project: { name: '凌栖 / Sojourn', tagline: 'AI灵魂游戏平台' },
    naming: {
      project: '凌栖 / Sojourn',
      soulEngine: '灵火 / Ember',
      worldEngine: '建木 / Arboreus',
      game: '战策 / Battleplan'
    },
    server: getServerStatus(),
    repos: getAllRepoStatus(),
    bugs: getBugSummary(),
    resources: getResourceStats(),
    sdk: getSdkVersions(),
    tasks: getTaskSummary()
  };
  res.json(data);
});

// Server status
app.get('/api/server', (req, res) => {
  res.json(getServerStatus());
});

// All repos status
app.get('/api/repos', (req, res) => {
  res.json(getAllRepoStatus());
});

// Single repo git log
app.get('/api/repos/:name/log', (req, res) => {
  const repo = REPOS[req.params.name];
  if (!repo) return res.status(404).json({ error: 'Unknown repo' });
  const count = parseInt(req.query.count) || 20;
  const log = gitCmd(repo, `log --oneline -${count} --pretty=format:"%h|%ad|%s" --date=short`);
  const entries = log.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|');
    return { hash: parts[0], date: parts[1], message: parts.slice(2).join('|') };
  });
  res.json({ repo: req.params.name, entries });
});

// Resources stats
app.get('/api/resources', (req, res) => {
  res.json(getResourceStats());
});

// Bugs
app.get('/api/bugs', (req, res) => {
  res.json(getBugSummary());
});

// Tasks
app.get('/api/tasks', (req, res) => {
  res.json(getTaskSummary());
});

// History / archive - management repo git log + round logs
app.get('/api/history', (req, res) => {
  const count = parseInt(req.query.count) || 50;
  const mgmtLog = gitCmd(REPOS.management, `log --oneline -${count} --pretty=format:"%h|%ad|%s" --date=short`);
  const entries = mgmtLog.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|');
    return { hash: parts[0], date: parts[1], message: parts.slice(2).join('|') };
  });

  // Read TASK_MANAGEMENT round log if exists
  const taskMgmt = readFileSafe(path.join(REPOS.management, 'TASK_MANAGEMENT.md'));

  res.json({ commits: entries, taskManagement: taskMgmt });
});

// Docs content
app.get('/api/docs/:name', (req, res) => {
  const docs = {
    strategy: 'MANAGEMENT_STRATEGY.md',
    bugs: 'BUG_TRACKER.md',
    tasks: 'TASK_MANAGEMENT.md',
    status: 'PROJECT_STATUS.md',
    blockers: 'BLOCKERS.md'
  };
  const file = docs[req.params.name];
  if (!file) return res.status(404).json({ error: 'Unknown doc' });
  const content = readFileSafe(path.join(REPOS.management, file), 15000);
  res.json({ name: req.params.name, file, content });
});

// SDK versions
app.get('/api/sdk', (req, res) => {
  res.json(getSdkVersions());
});

// ============= Data Collection Functions =============

function getServerStatus() {
  try {
    const result = execSync('curl -s --max-time 3 http://localhost:3000/healthz', { encoding: 'utf8' });
    const health = JSON.parse(result);
    return { status: 'running', ...health, checkedAt: new Date().toISOString() };
  } catch (e) {
    return { status: 'stopped', error: e.message, checkedAt: new Date().toISOString() };
  }
}

function getAllRepoStatus() {
  const result = {};
  for (const [name, repoPath] of Object.entries(REPOS)) {
    const lastCommit = gitCmd(repoPath, 'log -1 --pretty=format:"%h|%ad|%s" --date=short');
    const parts = lastCommit.split('|');
    const ahead = gitCmd(repoPath, 'rev-list --count origin/main..HEAD 2>nul || echo 0');
    const branch = gitCmd(repoPath, 'rev-parse --abbrev-ref HEAD');
    const dirty = gitCmd(repoPath, 'status --short');
    result[name] = {
      name,
      path: repoPath,
      branch,
      lastCommit: { hash: parts[0], date: parts[1], message: parts.slice(2).join('|') },
      ahead: parseInt(ahead) || 0,
      dirty: dirty ? dirty.split('\n').filter(l => l.trim()) : [],
      remote: gitCmd(repoPath, 'remote get-url origin')
    };
  }
  return result;
}

function getBugSummary() {
  try {
    const content = readFileSafe(path.join(REPOS.management, 'BUG_TRACKER.md'), 5000);
    if (!content) return { total: 0, active: 0, closed: 0 };
    const active = (content.match(/状态[：:]\s*.*(活跃|进行中|待确认|待修复|待回归)/g) || []).length;
    const closed = (content.match(/状态[：:]\s*.*(已关闭|已修复|关闭)/g) || []).length;
    const total = (content.match(/BUG-\d+/g) || []).length;
    return { total, active, closed, raw: content.substring(0, 2000) };
  } catch (e) {
    return { error: e.message };
  }
}

function getResourceStats() {
  const artDir = path.join(REPOS.management, 'docs', 'game-design', 'assets', 'art');
  const audioDir = path.join(REPOS.management, 'docs', 'game-design', 'assets', 'audio');
  const designDir = path.join(REPOS.management, 'docs', 'game-design');

  const artCount = countFiles(artDir, ['.png', '.jpg', '.jpeg', '.webp']);
  const audioCount = countFiles(audioDir, ['.wav', '.mp3', '.ogg']);
  const designDocs = countFiles(designDir, ['.md']);

  return {
    art: { count: artCount, dir: artDir },
    audio: { count: audioCount, dir: audioDir },
    designDocs: { count: designDocs, dir: designDir },
    total: artCount + audioCount
  };
}

function getSdkVersions() {
  const emberTags = gitCmd(REPOS.ember, 'tag --list "soularena-sdk-*" --sort=-v:refname').split('\n').filter(t => t.trim()).slice(0, 5);
  const arboreusTags = gitCmd(REPOS.arboreus, 'tag --list "seed-sdk-*" --sort=-v:refname').split('\n').filter(t => t.trim()).slice(0, 5);
  return {
    ember: { latest: emberTags[0] || 'unknown', recent: emberTags },
    arboreus: { latest: arboreusTags[0] || 'unknown', recent: arboreusTags }
  };
}

function getTaskSummary() {
  // Static task info (cron job IDs from TASK_MANAGEMENT)
  return [
    { id: '11660552305922', name: '总体监控', freq: '每30分钟', status: 'running', role: '总控、协调、报告' },
    { id: '11660550351618', name: '灵火Ember开发', freq: '每30分钟', status: 'running', role: '灵魂认知引擎开发（M9元认知）' },
    { id: '10946462145794', name: '建木Arboreus开发', freq: '每30分钟', status: 'running', role: '世界引擎开发（M10感知系统）' },
    { id: '11676672972290', name: '游戏设计', freq: '每小时', status: 'running', role: '设计/美术/音效资源生产' },
    { id: '11589274907650', name: '战策应用实现', freq: '每30分钟', status: 'running', role: 'M2 RTS对战竞技场开发' },
    { id: '11733966122242', name: '集成测试', freq: '每小时', status: 'running', role: 'M2测试+引擎回归' }
  ];
}

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  凌栖/Sojourn 项目管理仪表盘`);
  console.log(`  运行在: http://localhost:${PORT}`);
  console.log(`  项目根目录: ${ROOT}`);
  console.log(`========================================\n`);
});
