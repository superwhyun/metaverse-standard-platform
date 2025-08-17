// Local D1 connection using wrangler CLI
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LocalD1Adapter {
  private databaseName: string;

  constructor(databaseName: string = 'msp') {
    this.databaseName = databaseName;
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      // Escape SQL parameters properly
      let formattedSql = sql;
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          const placeholder = '?';
          const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
          formattedSql = formattedSql.replace(placeholder, String(value));
        });
      }

      const command = `npx wrangler d1 execute ${this.databaseName} --command="${formattedSql.replace(/"/g, '\\"')}" --json`;
      const { stdout, stderr } = await execAsync(command, { env: { ...process.env, NO_COLOR: '1' } });
      
      // Extract JSON from stdout - wrangler might include extra output
      const lines = stdout.trim().split('\n');
      let jsonLine = lines.find(line => line.trim().startsWith('[') || line.trim().startsWith('{'));
      
      if (!jsonLine) {
        // Try to find the last line that might be JSON
        jsonLine = lines[lines.length - 1];
      }
      
      if (!jsonLine) {
        throw new Error(`No JSON output found. stdout: ${stdout}, stderr: ${stderr}`);
      }
      
      const result = JSON.parse(jsonLine);
      return Array.isArray(result) ? result[0] : result; // Return first result if array
    } catch (error) {
      console.error('D1 Local query error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  prepare(sql: string) {
    return {
      get: async (params?: any) => {
        const result = await this.query(sql, params ? (Array.isArray(params) ? params : [params]) : []);
        return result.results?.[0] || null;
      },
      all: async (params?: any) => {
        const result = await this.query(sql, params ? (Array.isArray(params) ? params : [params]) : []);
        return result.results || [];
      },
      run: async (params?: any) => {
        const result = await this.query(sql, params ? (Array.isArray(params) ? params : [params]) : []);
        return {
          lastInsertRowid: result.meta?.last_row_id,
          changes: result.meta?.changes || 0
        };
      }
    };
  }

  exec(sql: string) {
    return this.query(sql);
  }

  pragma(pragma: string) {
    console.log(`D1 Local: Ignoring pragma: ${pragma}`);
  }
}