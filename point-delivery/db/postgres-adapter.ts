import type { Database, Statement } from "./contracts";
export type Query = { sql: string; values: unknown[] };
type Result = { rows: Record<string, unknown>[]; rowCount?: number | null };
export type Executor = { query(query: Query): Promise<Result>; transaction(queries: Query[]): Promise<Result[]> };
export function postgresSql(sql: string) {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, token => token === "?" ? `$${++index}` : token)
    .replace(/\bAS\s+(extraType|lowStock|maxQty|initialStock)\b/gi, 'AS "$1"');
}
function rowValues(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
    typeof value === "bigint" || (key === "count" && typeof value === "string") ? Number(value) : value]));
}
class Prepared implements Statement {
  readonly executor: Executor;
  readonly query: Query;
  constructor(executor: Executor, query: Query) { this.executor = executor; this.query = query; }
  bind(...values: unknown[]) { return new Prepared(this.executor, { ...this.query, values }); }
  async first<T = Record<string, unknown>>() { const result = await this.executor.query(this.query); return result.rows[0] ? rowValues(result.rows[0]) as T : null; }
  async all<T = Record<string, unknown>>() { return { results: (await this.executor.query(this.query)).rows.map(rowValues) as T[] }; }
  async run() { const result = await this.executor.query(this.query); return { meta: { changes: result.rowCount ?? result.rows.length } }; }
}
export function postgresDatabase(executor: Executor): Database {
  return {
    prepare(sql) { return new Prepared(executor, { sql: postgresSql(sql), values: [] }); },
    batch(statements) {
      const queries = statements.map(statement => {
        if (!(statement instanceof Prepared) || statement.executor !== executor) throw new Error("Invalid transaction statement.");
        return statement.query;
      });
      return executor.transaction(queries);
    },
  };
}
