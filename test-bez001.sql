-- 1) Kullanıcının dediği renk_id = 2787 ile eşleşen BEZ001 fişi var mı?
SELECT ik.id AS kalemId, ik.malzeme_id, ik.varyant1_renk_id, ik.brut_metre,
       i.tamamlandi, i.irsaliye_no,
       m.kod AS malzemeKod, r.kod AS renkKod, r.ad AS renkAd
FROM irsaliye_kalem ik
JOIN irsaliye i ON i.id = ik.irsaliye_id
JOIN malzeme m ON m.id = ik.malzeme_id
LEFT JOIN renk r ON r.id = ik.varyant1_renk_id
WHERE m.kod = 'BEZ001' AND ik.varyant1_renk_id = 2787
ORDER BY i.irsaliye_tarihi DESC;

-- 2) BEZ001'deki tamamlanmis tum fişlerin renk dagilimi (hangisi karsilasmadi?)
SELECT ik.varyant1_renk_id, r.kod AS renkKod, r.ad AS renkAd,
       SUM(ik.brut_metre) AS toplamMt, COUNT(*) AS kalemSayi
FROM irsaliye_kalem ik
JOIN irsaliye i ON i.id = ik.irsaliye_id
JOIN malzeme m ON m.id = ik.malzeme_id
LEFT JOIN renk r ON r.id = ik.varyant1_renk_id
WHERE m.kod = 'BEZ001' AND i.tamamlandi = 1
GROUP BY ik.varyant1_renk_id, r.kod, r.ad
ORDER BY toplamMt DESC;
