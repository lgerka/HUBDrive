import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres.lqryygrbuumxenzmyqik:VyjDuVLdMERsPLNl@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function main() {
  await pool.query(`
    UPDATE "News" 
    SET "coverImage" = 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop'
    WHERE "title" LIKE '%Rolls-Royce%';
  `);

  await pool.query(`
    UPDATE "News" 
    SET "coverImage" = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2670&auto=format&fit=crop'
    WHERE "title" LIKE '%Zeekr%';
  `);

  console.log("Images fixed!");
  process.exit(0);
}

main().catch(console.error);
