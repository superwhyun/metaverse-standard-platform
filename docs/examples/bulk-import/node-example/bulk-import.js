#!/usr/bin/env node

/**
 * 메타버스 국제표준화 플랫폼 보고서 일괄 등록 도구
 * 
 * 사용법:
 *   node bulk-import.js [options]
 * 
 * 옵션:
 *   --api-url <url>          API 기본 URL (기본값: http://localhost:3001)
 *   --username <username>    관리자 사용자명 (기본값: admin)
 *   --password <password>    관리자 비밀번호
 *   --csv-file <file>        CSV 파일 경로 (기본값: sample-data.csv)
 *   --batch-size <number>    배치 크기 (기본값: 3)
 *   --delay <ms>             요청 간 지연시간 (기본값: 500ms)
 *   --dry-run                실제 등록하지 않고 테스트만 실행
 *   --help                   도움말 표시
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const { Command } = require('commander');
const cliProgress = require('cli-progress');
const chalk = require('chalk');

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
        'Authorization': `Bearer ${this.token}`
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

class BulkImporter {
  constructor(client, options = {}) {
    this.client = client;
    this.batchSize = options.batchSize || 3;
    this.delay = options.delay || 500;
    this.dryRun = options.dryRun || false;
  }

  async loadCsvData(csvFilePath) {
    console.log(chalk.blue(`📄 CSV 파일 로드 중: ${csvFilePath}`));
    
    return new Promise((resolve, reject) => {
      const reports = [];
      
      if (!fs.existsSync(csvFilePath)) {
        reject(new Error(`CSV 파일을 찾을 수 없습니다: ${csvFilePath}`));
        return;
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // CSV 데이터를 API 형식으로 변환
          const report = {
            title: row.title?.trim(),
            date: row.date?.trim(),
            summary: row.summary?.trim(),
            content: row.content?.trim(),
            category: row.category?.trim(),
            organization: row.organization?.trim(),
            tags: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
            downloadUrl: row.downloadUrl?.trim() || undefined,
            conferenceId: row.conferenceId ? parseInt(row.conferenceId) : undefined
          };

          // 필수 필드 검증
          if (!report.title || !report.date || !report.summary || !report.content || !report.category || !report.organization) {
            console.warn(chalk.yellow(`⚠️  행 건너뜀 (필수 필드 누락): ${report.title || '제목 없음'}`));
            return;
          }

          reports.push(report);
        })
        .on('end', () => {
          console.log(chalk.green(`✅ CSV 로드 완료: ${reports.length}개 보고서`));
          resolve(reports);
        })
        .on('error', (error) => {
          console.error(chalk.red(`❌ CSV 로드 오류: ${error.message}`));
          reject(error);
        });
    });
  }

  async validateReports(reports) {
    console.log(chalk.blue('🔍 데이터 유효성 검사 중...'));
    
    const errors = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    reports.forEach((report, index) => {
      const rowNum = index + 2; // CSV 헤더 고려하여 +2

      // 날짜 형식 검사
      if (!dateRegex.test(report.date)) {
        errors.push(`행 ${rowNum}: 잘못된 날짜 형식 "${report.date}" (YYYY-MM-DD 필요)`);
      }

      // 제목 길이 검사
      if (report.title.length > 200) {
        errors.push(`행 ${rowNum}: 제목이 너무 깁니다 (${report.title.length}자, 최대 200자)`);
      }

      // URL 형식 검사 (있는 경우만)
      if (report.downloadUrl && !report.downloadUrl.startsWith('http')) {
        errors.push(`행 ${rowNum}: 잘못된 URL 형식 "${report.downloadUrl}"`);
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
    console.log(chalk.gray(`배치 크기: ${this.batchSize}, 지연시간: ${this.delay}ms`));

    const results = [];
    const progressBar = new cliProgress.SingleBar({
      format: `진행률 ${chalk.cyan('{bar}')} {percentage}% | {value}/{total} | 성공: {success} | 실패: {failed}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    }, cliProgress.Presets.shades_classic);

    progressBar.start(reports.length, 0, { success: 0, failed: 0 });

    for (let i = 0; i < reports.length; i += this.batchSize) {
      const batch = reports.slice(i, i + this.batchSize);
      const batchResults = await this.processBatch(batch, i + 1);
      results.push(...batchResults);

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      progressBar.update(i + batch.length, { success: successCount, failed: failedCount });

      // 마지막 배치가 아니면 지연
      if (i + this.batchSize < reports.length) {
        await this.sleep(this.delay);
      }
    }

    progressBar.stop();
    return results;
  }

  async processBatch(batch, startIndex) {
    const results = [];

    for (let i = 0; i < batch.length; i++) {
      const report = batch[i];
      const reportIndex = startIndex + i;

      try {
        if (this.dryRun) {
          // 테스트 모드: 실제 등록하지 않음
          results.push({
            success: true,
            title: report.title,
            id: `test-${reportIndex}`,
            index: reportIndex
          });
        } else {
          const result = await this.client.createReport(report);
          results.push({
            success: true,
            title: report.title,
            id: result.id,
            index: reportIndex
          });
        }
      } catch (error) {
        results.push({
          success: false,
          title: report.title,
          error: error.message,
          index: reportIndex
        });
      }
    }

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
      successful.forEach(r => {
        console.log(chalk.gray(`  ${r.index}. ${r.title} (ID: ${r.id})`));
      });
    }

    if (failed.length > 0) {
      console.log(chalk.red('\n❌ 실패한 보고서들:'));
      failed.forEach(r => {
        console.log(chalk.gray(`  ${r.index}. ${r.title}`));
        console.log(chalk.red(`     오류: ${r.error}`));
      });
    }

    // CSV 파일로 결과 저장
    this.saveResultsToCSV(results);
  }

  saveResultsToCSV(results) {
    const csvContent = [
      'index,title,success,id,error',
      ...results.map(r => [
        r.index,
        `"${r.title.replace(/"/g, '""')}"`,
        r.success,
        r.id || '',
        r.error ? `"${r.error.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const filename = `import-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(chalk.blue(`\n💾 결과를 저장했습니다: ${filename}`));
  }
}

// 메인 실행 함수
async function main() {
  const program = new Command();
  
  program
    .name('bulk-import')
    .description('메타버스 국제표준화 플랫폼 보고서 일괄 등록 도구')
    .version('1.0.0')
    .option('--api-url <url>', 'API 기본 URL', 'http://localhost:3001')
    .option('--username <username>', '관리자 사용자명', 'admin')
    .option('--password <password>', '관리자 비밀번호')
    .option('--csv-file <file>', 'CSV 파일 경로', 'sample-data.csv')
    .option('--batch-size <number>', '배치 크기', '3')
    .option('--delay <ms>', '요청 간 지연시간 (ms)', '500')
    .option('--dry-run', '실제 등록하지 않고 테스트만 실행', false)
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.blue.bold('🌐 메타버스 국제표준화 플랫폼 일괄 등록 도구'));
  console.log(chalk.gray('='.repeat(50)));

  // 비밀번호 입력 (옵션으로 제공되지 않은 경우)
  if (!options.password) {
    console.error(chalk.red('❌ 비밀번호가 필요합니다. --password 옵션을 사용하세요.'));
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

    // 일괄 등록기 초기화
    const importer = new BulkImporter(client, {
      batchSize: parseInt(options.batchSize),
      delay: parseInt(options.delay),
      dryRun: options.dryRun
    });

    // CSV 데이터 로드
    const reports = await importer.loadCsvData(options.csvFile);
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
    
    // 사용자 입력 대기 (간단한 구현)
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise((resolve) => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });

    // 일괄 등록 실행
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

module.exports = { MetaversePlatformClient, BulkImporter };