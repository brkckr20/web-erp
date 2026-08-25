const { PrismaClient } = require("@prisma/client");

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

const prisma = new PrismaClient();

function parseXml(xml) {
  const tarihMatch = xml.match(/Tarih="(\d{2})\.(\d{2})\.(\d{4})"/);
  if (!tarihMatch) throw new Error("Tarih parse edilemedi");
  const tarih = new Date(Number(tarihMatch[3]), Number(tarihMatch[2]) - 1, Number(tarihMatch[1]));

  const kurlar = [];
  const currencyRegex = /<Currency[^>]*Kod="([^"]+)"[^>]*>([\s\S]*?)<\/Currency>/g;
  let match;

  while ((match = currencyRegex.exec(xml)) !== null) {
    const kod = match[1];
    const body = match[2];

    const parse = (tag) => {
      const m = body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      if (!m || !m[1].trim()) return null;
      const val = parseFloat(m[1].trim());
      return isNaN(val) ? null : val;
    };

    const alisKuru = parse("ForexBuying");
    const satisKuru = parse("ForexSelling");
    const efektifAlis = parse("BanknoteBuying");
    const efektifSatis = parse("BanknoteSelling");

    if (alisKuru !== null || satisKuru !== null) {
      kurlar.push({ kod, alisKuru, satisKuru, efektifAlis, efektifSatis });
    }
  }

  return { tarih, kurlar };
}

async function main() {
  console.log("TCMB'dan kurlar çekiliyor...");

  const res = await fetch(TCMB_URL);
  if (!res.ok) throw new Error(`TCMB HTTP ${res.status}`);
  const xml = await res.text();

  const { tarih, kurlar } = parseXml(xml);
  console.log(`Tarih: ${tarih.toLocaleDateString("tr-TR")} — ${kurlar.length} döviz bulundu`);

  const dovizKodlari = await prisma.doviz.findMany({ select: { kod: true } });
  const gecerliKodlar = new Set(dovizKodlari.map((d) => d.kod));

  let eklenen = 0;
  let atlanan = 0;

  for (const kur of kurlar) {
    if (!gecerliKodlar.has(kur.kod)) {
      console.log(`  Atlandı: ${kur.kod} (doviz tablosunda yok)`);
      atlanan++;
      continue;
    }

    await prisma.dovizKuru.upsert({
      where: { tarih_dovizKodu: { tarih, dovizKodu: kur.kod } },
      update: {
        alisKuru: kur.alisKuru ?? 0,
        satisKuru: kur.satisKuru ?? 0,
        efektifAlis: kur.efektifAlis,
        efektifSatis: kur.efektifSatis,
      },
      create: {
        tarih,
        dovizKodu: kur.kod,
        alisKuru: kur.alisKuru ?? 0,
        satisKuru: kur.satisKuru ?? 0,
        efektifAlis: kur.efektifAlis,
        efektifSatis: kur.efektifSatis,
      },
    });
    eklenen++;
  }

  console.log(`Tamamlandı: ${eklenen} kayıt, ${atlanan} atlandı`);
}

main()
  .catch((e) => {
    console.error("HATA:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
