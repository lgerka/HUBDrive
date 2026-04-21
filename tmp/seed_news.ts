import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.news.create({
    data: {
      date: new Date(),
      title: "Электрический Rolls-Royce Phantom: Тишина обретает новую форму",
      excerpt: "Британская марка представляет свою первую полностью электрическую модель. Мы протестировали Phantom EV на дорогах Монако.",
      coverImage: "https://images.unsplash.com/photo-1631269415516-777e4e16a7eb?q=80&w=2670&auto=format&fit=crop",
      body: `
<h2>Новая эра роскоши</h2>
<p>Переход на электрическую тягу для <strong>Rolls-Royce</strong> — это не просто дань экологии, это идеальное попадание в философию бренда. Ведь главными атрибутами марки всегда были абсолютная тишина и плавность хода. Электродвигатели обеспечивают это на недостижимом для ДВС уровне.</p>

<blockquote>«Электрификация — это будущее Rolls-Royce. До 2030 года мы полностью откажемся от двигателей внутреннего сгорания. Наш первый электромобиль — это не компромисс, это лучший Rolls-Royce в истории.»<br>— Торстен Мюллер-Отвос, CEO</blockquote>

<h3>Технологии под капотом</h3>
<p>Два электромотора суммарной мощностью 584 л.с. разгоняют трехтонный сухопутный крейсер до сотни за 4.5 секунды. Запас хода по циклу WLTP составляет впечатляющие 520 километров.</p>  
      `,
      status: "published",
    }
  });

  await prisma.news.create({
    data: {
      date: new Date(),
      title: "Zeekr 001 FR - Убийца Tesla Plaid?",
      excerpt: "Видеообзор самого мощного китайского электромобиля от нашего постоянного клиента Максима.",
      coverImage: "https://images.unsplash.com/photo-1707255959955-4043b81180fe?q=80&w=2669&auto=format&fit=crop",
      body: `
<p>В этом коротком видео Макс делится впечатлениями от разгона 0-100 за 2 секунды. Мы привезли этот эксклюзивный автомобиль под заказ в кратчайшие сроки.</p>
<p>Потрясающая динамика, невероятное качество сборки и технологии будущего прямо здесь и сейчас.</p>
      `,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      status: "published",
    }
  });
}

main()
  .then(() => {
    console.log("Seeding complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
