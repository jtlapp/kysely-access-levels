import { Kysely, sql, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

const postgresConfig = {
  host: 'localhost',
  port: 5434,
  database: 'accesslevels_test',
  user: 'accesslevels_tester',
};

const tables = ['comments', 'posts', 'users'];

export async function createTables(db: Kysely<any>, keyDataType: string) {
  // TODO: does the user need to specify "serial"? I'd rather that be "integer".
  const refKeyType = keyDataType == 'serial' ? 'integer' : keyDataType;

  await db.schema
    .createTable('users')
    .addColumn('id', sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn('handle', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('posts')
    .addColumn('postID', sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn('ownerID', sql.raw(refKeyType), (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('title', 'text', (col) => col.unique().notNull())
    .addColumn('value', 'text')
    .execute();

  await db.schema
    .createTable('comments')
    .addColumn('commentID', 'serial', (col) => col.primaryKey())
    .addColumn('postID', sql.raw(refKeyType), (col) =>
      col.references('posts.postID').onDelete('cascade').notNull()
    )
    .addColumn('comment', 'text', (col) => col.notNull())
    .addColumn('value', 'text')
    .execute();

  return db;
}

async function dropTables(db: Kysely<any>) {
  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export async function createDatabase() {
  // Was needed to work with Supabase
  //
  // const postgresDB = new Kysely<any>({
  //   dialect: new PostgresDialect({ pool: new Pool(postgresConfig) }),
  // });
  // await sql`drop database if exists accesslevels_test`.execute(postgresDB);
  // await sql`create database accesslevels_test`.execute(postgresDB);
  // await postgresDB.destroy();
}

export async function createDB(keyDataType: string) {
  const testDB = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool(postgresConfig),
    }),
  });
  await createTables(testDB, keyDataType);
  return testDB;
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  // doesn't drop the database itself
  await dropTables(db);
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
