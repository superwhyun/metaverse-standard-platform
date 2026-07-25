#!/usr/bin/env node

/**
 * 표준 추천 기능용 일회성 동기화/검색 테스트 CLI
 *
 * 운영 환경에서는 구글시트에 바인딩된 Google Apps Script(이 저장소 밖)가 동기화를
 * 수행하고, 관리자가 그 결과 vector_store_id를 어드민 화면에 붙여넣는다. 이 스크립트는
 * 같은 로직을 Node에서 직접 실행해서 로컬/원격 D1을 갱신하고, 결과를 바로 검색까지
 * 테스트할 수 있게 해주는 로컬 전용 도구다.
 *
 * 사용법:
 *   OPENAI_API_KEY=sk-... node utils/sync-standard-catalog.js sync --sheet-url "https://docs.google.com/..."
 *   OPENAI_API_KEY=sk-... node utils/sync-standard-catalog.js sync --sheet-url "..." --remote
 *   OPENAI_API_KEY=sk-... node utils/sync-standard-catalog.js search "메타버스 접근성 관련 표준"
 */

const { execFileSync } = require('child_process');
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const Papa = require('papaparse');

const AUTO_POSTING_DIR = path.resolve(__dirname, '..');
const D1_DATABASE_NAME = 'metaverse-standards-dev';

function runWranglerD1(sql, { remote }) {
  const args = [
    'wrangler', 'd1', 'execute', D1_DATABASE_NAME,
    remote ? '--remote' : '--local',
    '--json',
    `--command=${sql}`,
  ];
  const output = execFileSync('npx', args, { cwd: AUTO_POSTING_DIR, encoding: 'utf-8' });
  return JSON.parse(output);
}

function getSettings({ remote }) {
  const result = runWranglerD1(
    'SELECT vector_store_id FROM standard_recommend_settings WHERE id = 1',
    { remote }
  );
  const row = result?.[0]?.results?.[0] || {};
  return {
    vectorStoreId: row.vector_store_id && row.vector_store_id !== 'null' ? row.vector_store_id : null,
  };
}

function toCsvExportUrl(sheetUrl) {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('올바른 구글 시트 링크가 아닙니다.');
  }
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
}

function formatRowAsText(row) {
  return Object.entries(row)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, value]) => `${key}: ${value ?? ''}`)
    .join('\n');
}

async function createVectorStore(apiKey, name) {
  const res = await fetch('https://api.openai.com/v1/vector_stores', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error(`Vector store 생성 실패: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
}

async function uploadFileToVectorStore(apiKey, vectorStoreId, fileName, content) {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'text/plain' }), fileName);
  formData.append('purpose', 'assistants');

  const uploadRes = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  if (!uploadRes.ok) {
    throw new Error(`파일 업로드 실패(${fileName}): ${uploadRes.status} ${await uploadRes.text()}`);
  }
  const uploaded = await uploadRes.json();

  const attachRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: uploaded.id }),
  });
  if (!attachRes.ok) {
    throw new Error(`Vector store 파일 추가 실패(${fileName}): ${attachRes.status} ${await attachRes.text()}`);
  }

  return uploaded.id;
}

async function deleteVectorStore(apiKey, vectorStoreId) {
  const res = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.warn(chalk.yellow(`⚠️  이전 vector store 삭제 실패(${vectorStoreId}): ${res.status}`));
  }
}

function requireApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('❌ OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.'));
    process.exit(1);
  }
  return apiKey;
}

async function runSync({ remote, sheetUrl }) {
  const apiKey = requireApiKey();
  const settings = getSettings({ remote });

  if (!sheetUrl) {
    console.error(chalk.red('❌ 시트 링크가 없습니다. --sheet-url 로 직접 넘겨주세요 (예: --sheet-url "https://docs.google.com/...").'));
    process.exit(1);
  }

  console.log(chalk.blue(`📥 구글 시트에서 데이터 가져오는 중... (${sheetUrl})`));
  const csvRes = await fetch(toCsvExportUrl(sheetUrl));
  if (!csvRes.ok) {
    throw new Error(`구글 시트를 불러오지 못했습니다: ${csvRes.status}`);
  }
  const csvText = await csvRes.text();

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data.filter((row) => Object.values(row).some((v) => (v ?? '').trim().length > 0));
  console.log(chalk.green(`✅ ${rows.length}개 행 파싱 완료`));

  if (rows.length === 0) {
    console.error(chalk.red('❌ 파싱된 행이 없습니다. 시트 내용을 확인하세요.'));
    process.exit(1);
  }

  console.log(chalk.blue('🗂️  새 Vector Store 생성 중...'));
  const vectorStoreId = await createVectorStore(apiKey, `standard-recommend-${Date.now()}`);
  console.log(chalk.green(`✅ Vector Store 생성됨: ${vectorStoreId}`));

  const bar = new cliProgress.SingleBar(
    { format: `업로드 중 ${chalk.cyan('{bar}')} {percentage}% | {value}/{total}` },
    cliProgress.Presets.shades_classic
  );
  bar.start(rows.length, 0);

  for (let i = 0; i < rows.length; i++) {
    const text = formatRowAsText(rows[i]);
    await uploadFileToVectorStore(apiKey, vectorStoreId, `standard-${i + 1}.txt`, text);
    bar.update(i + 1);
  }
  bar.stop();

  console.log(chalk.blue('💾 D1에 결과 저장 중...'));
  const now = new Date().toISOString();
  runWranglerD1(
    `UPDATE standard_recommend_settings SET vector_store_id = '${vectorStoreId}', last_synced_at = '${now}', last_sync_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
    { remote }
  );

  if (settings.vectorStoreId) {
    console.log(chalk.blue(`🗑️  이전 Vector Store 삭제 중... (${settings.vectorStoreId})`));
    await deleteVectorStore(apiKey, settings.vectorStoreId);
  }

  console.log(chalk.green(`\n✅ 동기화 완료! ${rows.length}개 표준, Vector Store: ${vectorStoreId}`));
}

async function runSearch({ remote, query }) {
  const apiKey = requireApiKey();
  const settings = getSettings({ remote });

  if (!settings.vectorStoreId) {
    console.error(chalk.red('❌ 아직 동기화된 적이 없습니다. 먼저 sync 명령을 실행하세요.'));
    process.exit(1);
  }

  console.log(chalk.blue(`🔍 검색 중: "${query}" (vector store: ${settings.vectorStoreId})`));

  const systemPrompt = `당신은 메타버스와 관련 기술 표준 전문가입니다.

연결된 파일 검색 도구(file_search)를 사용해서, 사용자의 요구사항과 관련된 실제 표준을
찾아 추천해주세요. 파일 검색으로 찾은 실제 데이터에 근거해서만 답변하고, 검색 결과에 없는
표준을 지어내지 마세요. 최대 3개까지, JSON 배열로만 답하세요.
[{"id":"...","title":"...","organization":"...","description":"...","relevanceScore":0-100,"tags":[...],"status":"...","publishedDate":"..."}]`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5-nano',
      reasoning: { effort: 'low' },
      input: [{ role: 'user', content: `${systemPrompt}\n\n사용자 요구사항: ${query}` }],
      tools: [{ type: 'file_search', vector_store_ids: [settings.vectorStoreId] }],
      max_output_tokens: 2048,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API 오류: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  console.log(chalk.green('\n✅ 응답:'));
  console.log(data.output_text || JSON.stringify(data, null, 2));
}

const program = new Command();
program
  .name('sync-standard-catalog')
  .description('구글시트 표준 목록을 OpenAI Vector Store로 동기화하거나 검색을 테스트하는 일회성 CLI');

program
  .command('sync')
  .description('구글시트를 읽어 새 Vector Store를 만들고 D1에 반영')
  .option('--remote', '로컬 대신 원격(프로덕션) D1 사용', false)
  .option('--sheet-url <url>', '동기화할 구글시트 링크 (필수)')
  .action((opts) => {
    runSync({ remote: opts.remote, sheetUrl: opts.sheetUrl }).catch((err) => {
      console.error(chalk.red(`❌ ${err.message}`));
      process.exit(1);
    });
  });

program
  .command('search <query>')
  .description('현재 동기화된 Vector Store로 검색 테스트 (앱 없이 바로 OpenAI 호출)')
  .option('--remote', '로컬 대신 원격(프로덕션) D1 사용', false)
  .action((query, opts) => {
    runSearch({ remote: opts.remote, query }).catch((err) => {
      console.error(chalk.red(`❌ ${err.message}`));
      process.exit(1);
    });
  });

program.parse();
