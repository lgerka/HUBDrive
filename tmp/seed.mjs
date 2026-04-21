import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres.lqryygrbuumxenzmyqik:VyjDuVLdMERsPLNl@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function main() {
  const rs1 = await pool.query(`
    INSERT INTO "News" ("id", "title", "excerpt", "coverImage", "body", "videoUrl", "status", "date", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      'Электрический Rolls-Royce Phantom: Тишина обретает новую форму',
      'Британская марка представляет свою первую полностью электрическую модель. Мы протестировали Phantom EV на дорогах Монако.',
      'https://images.unsplash.com/photo-1631269415516-777e4e16a7eb?q=80&w=2670&auto=format&fit=crop',
      '<h2>Новая эра роскоши</h2><p>Переход на электрическую тягу для <strong>Rolls-Royce</strong> — это не просто дань экологии, это идеальное попадание в философию бренда. Ведь главными атрибутами марки всегда были абсолютная тишина и плавность хода.</p><blockquote>«Электрификация — это будущее Rolls-Royce. До 2030 года мы полностью откажемся от двигателей внутреннего сгорания.»<br>— Торстен Мюллер-Отвос, CEO</blockquote><h3>Технологии под капотом</h3><p>Два электромотора суммарной мощностью 584 л.с. разгоняют трехтонный сухопутный крейсер до сотни за 4.5 секунды. Запас хода по циклу WLTP составляет впечатляющие 520 километров.</p>',
      null,
      'published',
      now(),
      now()
    )
  `);
  
  const rs2 = await pool.query(`
    INSERT INTO "News" ("id", "title", "excerpt", "coverImage", "body", "videoUrl", "status", "date", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      'Zeekr 001 FR - Убийца Tesla Plaid?',
      'Видеообзор самого мощного китайского электромобиля от нашего постоянного клиента Максима.',
      'https://images.unsplash.com/photo-1707255959955-4043b81180fe?q=80&w=2669&auto=format&fit=crop',
      '<p>В этом коротком видео Макс делится впечатлениями от разгона 0-100 за 2 секунды. Мы привезли этот эксклюзивный автомобиль под заказ в кратчайшие сроки.</p>',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'published',
      now(),
      now()
    )
  `);

  console.log("Inserted!");
  process.exit(0);
}

main().catch(console.error);
