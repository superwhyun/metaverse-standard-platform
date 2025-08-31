#!/usr/bin/env node

/**
 * 메타버스 국제표준화 플랫폼 MD 파일 보고서 등록 도구
 * 
 * 사용법:
 *   node md-to-report.js [options]
 * 
 * 옵션:
 *   --file <file>            MD 파일 경로
 *   --dir <directory>        MD 파일들이 있는 디렉토리
 *   --api-url <url>          API 기본 URL (기본값: http://localhost:3001)
 *   --username <username>    관리자 사용자명 (기본값: admin)
 *   --password <password>    관리자 비밀번호
 *   --dry-run                실제 등록하지 않고 테스트만 실행
 *   --help                   도움말 표시
 * 
 * MD 파일 포맷:
 *   ---
 *   title: "보고서 제목"
 *   date: "2024-01-15"
 *   summary: "보고서 요약"
 *   category: "카테고리명"
 *   organization: "표준화 기구명"
 *   tags: ["태그1", "태그2"]
 *   downloadUrl: "https://example.com/file.pdf"  # 선택사항
 *   conferenceId: 123  # 선택사항
 *   ---
 *   
 *   마크다운 본문 내용...
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const fetch = require('node-fetch');
const { Command } = require('commander');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const glob = require('glob');

// 기존 bulk-import.js에서 MetaversePlatformClient 클래스 가져오기
class MetaversePlatformClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // 마지막 슬래시 제거
    this.token = null;
  }

  async login(username, password) {
    console.log(chalk.blue('🔐 관리자 로그인 중...'));
    
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`로그인 실패 (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      // 응답 헤더에서 토큰 추출
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const tokenMatch = setCookie.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
          this.token = tokenMatch[1];
        }
      }

      if (!this.token) {
        throw new Error('JWT 토큰을 찾을 수 없습니다.');
      }

      console.log(chalk.green(`✅ 로그인 성공: ${data.user.name}`));
      return data.user;
    } catch (error) {
      console.error(chalk.red(`❌ 로그인 오류: ${error.message}`));
      throw error;
    }
  }

  async createReport(reportData) {
    if (!this.token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${this.apiUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${this.token}`
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    return result.data;
  }

  async testConnection() {
    console.log(chalk.blue(`🔍 API 연결 테스트: ${this.apiUrl}`));
    
    try {
      const response = await fetch(`${this.apiUrl}/api/reports?limit=1`);
      if (response.ok) {
        console.log(chalk.green('✅ API 연결 성공'));
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ API 연결 실패: ${error.message}`));
      return false;
    }
  }
}

class MarkdownReportImporter {
  constructor(client, options = {}) {
    this.client = client;
    this.dryRun = options.dryRun || false;
  }

  async loadMarkdownFiles(input) {
    console.log(chalk.blue(`📄 마크다운 파일 로드 중...`));
    
    let filePaths = [];
    
    if (fs.statSync(input).isDirectory()) {
      // 디렉토리인 경우 모든 .md 파일 찾기
      const pattern = path.join(input, '**/*.md');
      filePaths = glob.sync(pattern);
      console.log(chalk.gray(`디렉토리에서 ${filePaths.length}개의 .md 파일 발견`));
    } else {
      // 단일 파일인 경우
      if (path.extname(input) !== '.md') {
        throw new Error('마크다운 파일(.md)만 지원됩니다.');
      }
      filePaths = [input];
    }

    if (filePaths.length === 0) {
      throw new Error('처리할 마크다운 파일이 없습니다.');
    }

    const reports = [];
    const errors = [];

    for (const filePath of filePaths) {
      try {
        const report = await this.parseMarkdownFile(filePath);
        reports.push({ ...report, sourceFile: filePath });
      } catch (error) {
        errors.push({
          file: filePath,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      console.log(chalk.yellow(`⚠️ ${errors.length}개 파일에서 오류 발생:`));
      errors.forEach(err => {
        console.log(chalk.red(`  ${err.file}: ${err.error}`));
      });
    }

    console.log(chalk.green(`✅ ${reports.length}개 보고서 로드 완료`));
    return reports;
  }

  async parseMarkdownFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(fileContent);

    // frontmatter 검증
    const frontmatter = parsed.data;
    const content = parsed.content.trim();

    if (!content) {
      throw new Error('마크다운 본문 내용이 없습니다.');
    }

    // 필수 필드 검증
    const requiredFields = ['title', 'date', 'summary', 'category', 'organization'];
    for (const field of requiredFields) {
      if (!frontmatter[field]) {
        throw new Error(`필수 필드 누락: ${field}`);
      }
    }

    // 데이터 타입 변환 및 검증
    const report = {
      title: String(frontmatter.title).trim(),
      date: String(frontmatter.date).trim(),
      summary: String(frontmatter.summary).trim(),
      content: content,
      category: String(frontmatter.category).trim(),
      organization: String(frontmatter.organization).trim(),
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      downloadUrl: frontmatter.downloadUrl ? String(frontmatter.downloadUrl).trim() : undefined,
      conferenceId: frontmatter.conferenceId ? parseInt(frontmatter.conferenceId) : undefined
    };

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(report.date)) {
      throw new Error(`잘못된 날짜 형식: ${report.date} (YYYY-MM-DD 필요)`);
    }

    // URL 형식 검증 (있는 경우만)
    if (report.downloadUrl && !report.downloadUrl.startsWith('http')) {
      throw new Error(`잘못된 URL 형식: ${report.downloadUrl}`);
    }

    return report;
  }

  async validateReports(reports) {
    console.log(chalk.blue('🔍 데이터 유효성 검사 중...'));
    
    const errors = [];

    reports.forEach((report, index) => {
      // 제목 길이 검사
      if (report.title.length > 200) {
        errors.push(`${report.sourceFile}: 제목이 너무 깁니다 (${report.title.length}자, 최대 200자)`);
      }

      // 요약 길이 검사
      if (report.summary.length > 500) {
        errors.push(`${report.sourceFile}: 요약이 너무 깁니다 (${report.summary.length}자, 최대 500자)`);
      }

      // 본문 길이 검사
      if (report.content.length > 50000) {
        errors.push(`${report.sourceFile}: 본문이 너무 깁니다 (${report.content.length}자, 최대 50000자)`);
      }
    });

    if (errors.length > 0) {
      console.error(chalk.red(`❌ ${errors.length}개의 유효성 검사 오류:`));
      errors.forEach(error => console.error(chalk.red(`  ${error}`)));
      throw new Error('데이터 유효성 검사 실패');
    }

    console.log(chalk.green('✅ 데이터 유효성 검사 통과'));
  }

  async importReports(reports) {
    console.log(chalk.blue(`\n🚀 ${this.dryRun ? '테스트 모드로 ' : ''}보고서 등록 시작`));

    const results = [];
    const progressBar = new cliProgress.SingleBar({
      format: `진행률 ${chalk.cyan('{bar}')} {percentage}% | {value}/{total} | 성공: {success} | 실패: {failed}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    }, cliProgress.Presets.shades_classic);

    progressBar.start(reports.length, 0, { success: 0, failed: 0 });

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      try {
        if (this.dryRun) {
          // 테스트 모드: 실제 등록하지 않음
          results.push({
            success: true,
            title: report.title,
            file: report.sourceFile,
            id: `test-${i + 1}`
          });
        } else {
          const result = await this.client.createReport(report);
          results.push({
            success: true,
            title: report.title,
            file: report.sourceFile,
            id: result.id
          });
        }
      } catch (error) {
        results.push({
          success: false,
          title: report.title,
          file: report.sourceFile,
          error: error.message
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      progressBar.update(i + 1, { success: successCount, failed: failedCount });

      // API 부하 방지를 위한 약간의 지연
      if (i < reports.length - 1) {
        await this.sleep(200);
      }
    }

    progressBar.stop();
    return results;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary(results) {
    console.log(chalk.blue('\n📊 등록 결과 요약'));
    console.log(chalk.gray('================'));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`${chalk.green('✅ 성공:')} ${successful.length}개`);
    console.log(`${chalk.red('❌ 실패:')} ${failed.length}개`);
    console.log(`${chalk.blue('📄 전체:')} ${results.length}개`);

    if (successful.length > 0) {
      console.log(chalk.green('\n✅ 성공한 보고서들:'));
      successful.forEach((r, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${r.title} (ID: ${r.id})`));
        console.log(chalk.gray(`     파일: ${r.file}`));
      });
    }

    if (failed.length > 0) {
      console.log(chalk.red('\n❌ 실패한 보고서들:'));
      failed.forEach((r, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${r.title}`));
        console.log(chalk.gray(`     파일: ${r.file}`));
        console.log(chalk.red(`     오류: ${r.error}`));
      });
    }
  }
}

// 메인 실행 함수
async function main() {
  const program = new Command();
  
  program
    .name('md-to-report')
    .description('메타버스 국제표준화 플랫폼 MD 파일 보고서 등록 도구')
    .version('1.0.0')
    .option('--file <file>', 'MD 파일 경로')
    .option('--dir <directory>', 'MD 파일들이 있는 디렉토리')
    .option('--api-url <url>', 'API 기본 URL', 'http://localhost:3001')
    .option('--username <username>', '관리자 사용자명', 'admin')
    .option('--password <password>', '관리자 비밀번호')
    .option('--dry-run', '실제 등록하지 않고 테스트만 실행', false)
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.blue.bold('📝 메타버스 플랫폼 MD 파일 보고서 등록 도구'));
  console.log(chalk.gray('='.repeat(50)));

  // 입력 검증
  if (!options.file && !options.dir) {
    console.error(chalk.red('❌ --file 또는 --dir 옵션이 필요합니다.'));
    process.exit(1);
  }

  if (options.file && options.dir) {
    console.error(chalk.red('❌ --file과 --dir 옵션을 동시에 사용할 수 없습니다.'));
    process.exit(1);
  }

  if (!options.password) {
    console.error(chalk.red('❌ 비밀번호가 필요합니다. --password 옵션을 사용하세요.'));
    process.exit(1);
  }

  const inputPath = options.file || options.dir;
  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`❌ 경로를 찾을 수 없습니다: ${inputPath}`));
    process.exit(1);
  }

  try {
    // API 클라이언트 초기화
    const client = new MetaversePlatformClient(options.apiUrl);
    
    // 연결 테스트
    const connected = await client.testConnection();
    if (!connected) {
      process.exit(1);
    }

    // 마크다운 가져오기 도구 초기화
    const importer = new MarkdownReportImporter(client, {
      dryRun: options.dryRun
    });

    // 마크다운 파일 로드
    const reports = await importer.loadMarkdownFiles(inputPath);
    if (reports.length === 0) {
      console.error(chalk.red('❌ 등록할 보고서가 없습니다.'));
      process.exit(1);
    }

    // 데이터 유효성 검사
    await importer.validateReports(reports);

    // 로그인 (테스트 모드가 아닌 경우)
    if (!options.dryRun) {
      await client.login(options.username, options.password);
    }

    // 확인 프롬프트
    console.log(chalk.yellow(`\n⚠️  ${reports.length}개의 보고서를 ${options.dryRun ? '테스트 모드로' : ''} 등록하시겠습니까?`));
    console.log(chalk.gray('계속하려면 Enter를 누르세요... (Ctrl+C로 취소)'));
    
    // 사용자 입력 대기
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise((resolve) => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

    // 보고서 등록 실행
    const results = await importer.importReports(reports);

    // 결과 출력
    importer.printSummary(results);

    // 종료 코드 설정
    const hasErrors = results.some(r => !r.success);
    process.exit(hasErrors ? 1 : 0);

  } catch (error) {
    console.error(chalk.red(`\n💥 치명적 오류: ${error.message}`));
    process.exit(1);
  }
}

// 프로그램 실행
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red(`예상치 못한 오류: ${error.message}`));
    process.exit(1);
  });
}

module.exports = { MarkdownReportImporter };