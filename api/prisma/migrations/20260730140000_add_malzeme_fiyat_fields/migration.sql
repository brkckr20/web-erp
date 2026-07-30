ALTER TABLE malzeme_fiyat ADD kod VARCHAR(50) NULL;
ALTER TABLE malzeme_fiyat ADD aciklama VARCHAR(500) NULL;
ALTER TABLE malzeme_fiyat ADD doviz_kuru DECIMAL(18,6) NULL;
ALTER TABLE malzeme_fiyat ADD baslangic DATE NULL;
ALTER TABLE malzeme_fiyat ADD bitis DATE NULL;
ALTER TABLE malzeme_fiyat ADD kullanimda BIT NULL;
