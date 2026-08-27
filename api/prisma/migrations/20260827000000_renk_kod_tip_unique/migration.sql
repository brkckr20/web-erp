-- Mevcut tekil kod constraint'ini kaldır
ALTER TABLE renk DROP CONSTRAINT IF EXISTS Renk_kod;

-- Yeni bileşik unique constraint ekle (kod + tip)
ALTER TABLE renk ADD CONSTRAINT UQ_renk_kod_tip UNIQUE (kod, tip);
