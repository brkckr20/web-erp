BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[parametre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [grup] NVARCHAR(50) NOT NULL,
    [anahtar] NVARCHAR(50) NOT NULL,
    [deger] NVARCHAR(max) NOT NULL,
    [guncelleyen] NVARCHAR(100),
    [guncelleme_tarihi] DATETIME2 NOT NULL CONSTRAINT [parametre_guncelleme_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [parametre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [parametre_grup_anahtar_key] UNIQUE NONCLUSTERED ([grup],[anahtar])
);

-- CreateTable
CREATE TABLE [dbo].[kolon_secimi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kullanici_id] INT NOT NULL,
    [ekran_adi] NVARCHAR(1000) NOT NULL,
    [kolon_adi] NVARCHAR(1000) NOT NULL,
    [gizli] BIT NOT NULL CONSTRAINT [kolon_secimi_gizli_df] DEFAULT 0,
    [genislik] INT,
    [sira] INT,
    [siralama_yon] NVARCHAR(1000),
    CONSTRAINT [kolon_secimi_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kolon_secimi_kullanici_id_ekran_adi_kolon_adi_key] UNIQUE NONCLUSTERED ([kullanici_id],[ekran_adi],[kolon_adi])
);

-- CreateTable
CREATE TABLE [dbo].[depo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [durum] BIT NOT NULL CONSTRAINT [depo_durum_df] DEFAULT 1,
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [is_yeri_kodu] VARCHAR(50),
    [negatif_stok_kontrol] VARCHAR(50),
    [kritik_stok_kontrol] VARCHAR(50),
    [ana_depo_on_degeri] BIT NOT NULL CONSTRAINT [depo_ana_depo_on_degeri_df] DEFAULT 0,
    [sevkiyat_depo_on_degeri] BIT NOT NULL CONSTRAINT [depo_sevkiyat_depo_on_degeri_df] DEFAULT 0,
    [sanal_depo] BIT NOT NULL CONSTRAINT [depo_sanal_depo_df] DEFAULT 0,
    [antrepo_depo] BIT NOT NULL CONSTRAINT [depo_antrepo_depo_df] DEFAULT 0,
    [show_room_deposu] BIT NOT NULL CONSTRAINT [depo_show_room_deposu_df] DEFAULT 0,
    [kartela_deposu] BIT NOT NULL CONSTRAINT [depo_kartela_deposu_df] DEFAULT 0,
    [adres_1] VARCHAR(500),
    [adres_2] VARCHAR(500),
    [posta_kodu] VARCHAR(20),
    [bolge] VARCHAR(100),
    [ulke] VARCHAR(100),
    [sehir] VARCHAR(100),
    [ilce] VARCHAR(100),
    [telefon] VARCHAR(30),
    [faks] VARCHAR(30),
    [eposta] VARCHAR(150),
    [gps_x] VARCHAR(50),
    [gps_y] VARCHAR(50),
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [depo_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [barkod_on_eki] VARCHAR(20),
    CONSTRAINT [depo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [depo_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[kullanici] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [durum] BIT NOT NULL CONSTRAINT [kullanici_durum_df] DEFAULT 1,
    [giris_kodu] VARCHAR(50),
    [sifre] VARCHAR(255),
    [kullanici_rolu] VARCHAR(100),
    [cari_hesap_kodu] VARCHAR(50),
    [yetkili_adi] VARCHAR(200),
    [kasa_kodu] VARCHAR(50),
    [departman_kodu] VARCHAR(50),
    [personel_kodu] VARCHAR(50),
    [masraf_yeri] VARCHAR(100),
    [dil_ondegeri] VARCHAR(20),
    [ozel_kod] VARCHAR(50),
    [aciklama] VARCHAR(500),
    [kullanici_tipi] VARCHAR(100),
    [favoriler] NVARCHAR(max),
    [satis_elemani] BIT NOT NULL CONSTRAINT [kullanici_satis_elemani_df] DEFAULT 0,
    [mobil_kullanici] BIT NOT NULL CONSTRAINT [kullanici_mobil_kullanici_df] DEFAULT 0,
    [hizmet_sunucusu] BIT NOT NULL CONSTRAINT [kullanici_hizmet_sunucusu_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kullanici_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kullanici_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kullanici_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[malzeme] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [malzeme_kullanimda_df] DEFAULT 1,
    [tip] INT NOT NULL CONSTRAINT [malzeme_tip_df] DEFAULT 1,
    [malzeme_turu] VARCHAR(100),
    [tipi] VARCHAR(100),
    [kategori] VARCHAR(100),
    [plu_kodu] VARCHAR(50),
    [raf_omru] INT,
    [raf_omru_birim] VARCHAR(20),
    [sezon] VARCHAR(100),
    [marka_id] INT,
    [model] VARCHAR(100),
    [musteri_temsilcisi] VARCHAR(200),
    [kdv_genel] VARCHAR(50),
    [kdv_perakende] VARCHAR(50),
    [kdv_toptan] VARCHAR(50),
    [kdv_p_satis_iade] VARCHAR(50),
    [kdv_t_satis_iade] VARCHAR(50),
    [ek_vergi_tanimi] VARCHAR(100),
    [tevkifat_satin_alma_pay] INT,
    [tevkifat_satin_alma_payda] INT,
    [tevkifat_satis_pay] INT,
    [tevkifat_satis_payda] INT,
    [kullanim_yeri] VARCHAR(200),
    [takip_sekli] VARCHAR(200),
    [uretici_firma_kodu] VARCHAR(50),
    [uretici_urun_kodu] VARCHAR(100),
    [iso_dokuman_no] VARCHAR(100),
    [gtip_no] VARCHAR(50),
    [web_sayfasi] VARCHAR(500),
    [kampanya_grubu] VARCHAR(100),
    [fiyat_grubu] VARCHAR(100),
    [operasyon_kodu] VARCHAR(50),
    [grup_id] INT,
    [kumas_turu_id] INT,
    [numarator_id] INT,
    [aksesuar_tipi_id] INT,
    [cinsi] VARCHAR(100),
    [renk] VARCHAR(100),
    [ebat] VARCHAR(100),
    [desen_kodu] NVARCHAR(100),
    [ozellik_1] VARCHAR(200),
    [ozellik_2] VARCHAR(200),
    [ozellik_3] VARCHAR(200),
    [ozellik_4] VARCHAR(200),
    [derece] VARCHAR(100),
    [en_olcu] VARCHAR(100),
    [boy_olcu] VARCHAR(100),
    [kapak] VARCHAR(100),
    [micron] VARCHAR(100),
    [grm2] DECIMAL(10,2),
    [en] DECIMAL(10,2),
    [boy] DECIMAL(10,2),
    [iplik_boyali] BIT CONSTRAINT [malzeme_iplik_boyali_df] DEFAULT 0,
    [orme_tipi] VARCHAR(50),
    [kumas_uretim_tipi] VARCHAR(50),
    [hesap_birimi] VARCHAR(50),
    [iplik_no_id] INT,
    [iplik_cinsi_id] INT,
    [organik] BIT CONSTRAINT [malzeme_organik_df] DEFAULT 0,
    [iplik_kompozisyon_id] INT,
    [kayit_yapan] VARCHAR(100),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [malzeme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [malzeme_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[marka] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [marka_kullanimda_df] DEFAULT 1,
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [marka_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [marka_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [marka_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[grup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [grup_kullanimda_df] DEFAULT 1,
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [grup_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [grup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [grup_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[numarator] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(100) NOT NULL,
    [on_ek] VARCHAR(20) NOT NULL,
    [son_no] INT NOT NULL CONSTRAINT [numarator_son_no_df] DEFAULT 0,
    [kullanimda] BIT NOT NULL CONSTRAINT [numarator_kullanimda_df] DEFAULT 1,
    [tip] VARCHAR(20) NOT NULL CONSTRAINT [numarator_tip_df] DEFAULT 'kumas',
    [grup_kodu] NVARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [numarator_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [numarator_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ozellik_kodlama] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] NVARCHAR(200) NOT NULL,
    [kategori] VARCHAR(100) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ozellik_kodlama_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [ozellik_kodlama_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[makina] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [makina_kullanimda_df] DEFAULT 1,
    [makina_turu] VARCHAR(100),
    [marka] VARCHAR(100),
    [model] VARCHAR(100),
    [seri_no] VARCHAR(100),
    [envanter_no] VARCHAR(100),
    [kategori] VARCHAR(100),
    [lokasyon] VARCHAR(200),
    [departman] VARCHAR(100),
    [sorumlu] VARCHAR(200),
    [uretici_firma] VARCHAR(200),
    [tedarikci] VARCHAR(200),
    [alim_tarihi] DATETIME2,
    [garanti_bitis] DATETIME2,
    [alim_bedeli] DECIMAL(18,2),
    [guc_kw] DECIMAL(18,2),
    [kapasite] VARCHAR(100),
    [kapasite_birim] VARCHAR(50),
    [voltaj] VARCHAR(50),
    [bakim_periyodu] INT,
    [bakim_periyodu_birim] VARCHAR(20),
    [son_bakim_tarihi] DATETIME2,
    [durumu] VARCHAR(50),
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [makina_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [makina_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [makina_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[cari_hesap] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [cari_hesap_kullanimda_df] DEFAULT 1,
    [erisim_kodu] VARCHAR(50),
    [ozel_kod] VARCHAR(50),
    [grubu] VARCHAR(100),
    [sektoru] VARCHAR(100),
    [ticari_islem_grubu] VARCHAR(100),
    [cari_hesap_tipi] VARCHAR(100),
    [cari_hesap_turu] VARCHAR(100),
    [ticari_unvani] VARCHAR(200),
    [personel] VARCHAR(100),
    [satis_personeli] VARCHAR(100),
    [satis_kanali] VARCHAR(100),
    [araci_kurum] VARCHAR(100),
    [potansiyel] BIT NOT NULL CONSTRAINT [cari_hesap_potansiyel_df] DEFAULT 0,
    [bayi] BIT NOT NULL CONSTRAINT [cari_hesap_bayi_df] DEFAULT 0,
    [faktoring] BIT NOT NULL CONSTRAINT [cari_hesap_faktoring_df] DEFAULT 0,
    [musteri_hesap_kodu] VARCHAR(50),
    [satici_hesap_kodu] VARCHAR(50),
    [vade_farki_faiz_orani] VARCHAR(20),
    [vade_opsiyonu] VARCHAR(20),
    [odeme_plani] VARCHAR(100),
    [indirim_kodu] VARCHAR(50),
    [fiyat_kodu] VARCHAR(50),
    [alis_indirim_kodu] VARCHAR(50),
    [satis_indirim_kodu] VARCHAR(50),
    [vergi_dairesi] VARCHAR(100),
    [vergi_no] VARCHAR(50),
    [doviz_cinsi] VARCHAR(10),
    [doviz_kur_tipi] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [cari_hesap_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [cari_hesap_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cari_hesap_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[irsaliye] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_no] VARCHAR(50) NOT NULL,
    [irsaliye_tipi] VARCHAR(20) NOT NULL,
    [irsaliye_tarihi] DATETIME2 NOT NULL,
    [aciklama] VARCHAR(1000),
    [fatura_no] VARCHAR(50),
    [fatura_tarihi] DATETIME2,
    [sevk_no] VARCHAR(50),
    [sevk_tarihi] DATETIME2,
    [onaylandi] BIT NOT NULL CONSTRAINT [irsaliye_onaylandi_df] DEFAULT 0,
    [tamamlandi] BIT NOT NULL CONSTRAINT [irsaliye_tamamlandi_df] DEFAULT 0,
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [yetkili] VARCHAR(200),
    [cari_hesap_id] INT,
    [depo_id] INT,
    [fason_tipi_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [irsaliye_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [irsaliye_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [irsaliye_irsaliye_tipi_irsaliye_no_key] UNIQUE NONCLUSTERED ([irsaliye_tipi],[irsaliye_no])
);

-- CreateTable
CREATE TABLE [dbo].[irsaliye_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [irsaliye_id] INT NOT NULL,
    [malzeme_id] INT,
    [tip] VARCHAR(20),
    [takip_no] VARCHAR(100),
    [brut_agirlik] DECIMAL(18,4),
    [net_agirlik] DECIMAL(18,4),
    [brut_metre] DECIMAL(18,4),
    [net_metre] DECIMAL(18,4),
    [adet] INT,
    [olcu_birimi] VARCHAR(20),
    [miktar] DECIMAL(18,4),
    [birim_fiyat] DECIMAL(18,4),
    [doviz] VARCHAR(10),
    [kdv] DECIMAL(18,2),
    [satir_tutari] DECIMAL(18,2),
    [aciklama] VARCHAR(1000),
    [uuid] VARCHAR(100),
    [varyant1_renk_id] INT,
    [varyant1_renk_kod] NVARCHAR(50),
    [varyant1_renk_ad] NVARCHAR(200),
    [varyant2_renk_id] INT,
    [varyant2_renk_kod] NVARCHAR(50),
    [varyant2_renk_ad] NVARCHAR(200),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [irsaliye_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [irsaliye_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[iade_talep] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_no] NVARCHAR(50) NOT NULL,
    [model_kod] NVARCHAR(50) NOT NULL,
    [model_ad] NVARCHAR(200),
    [renk_ad] NVARCHAR(100) NOT NULL,
    [beden] NVARCHAR(20) NOT NULL,
    [kumas_ad] NVARCHAR(200),
    [kumas_renk] NVARCHAR(100),
    [kalan_mt] DECIMAL(18,4),
    [durum] NVARCHAR(20) NOT NULL CONSTRAINT [iade_talep_durum_df] DEFAULT 'BEKLEMEDE',
    [olusturan_kullanici] INT,
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [iade_talep_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    [islenme_tarihi] DATETIME2,
    [irsaliye_id] INT,
    [aciklama] NVARCHAR(500),
    CONSTRAINT [iade_talep_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[barkod_eslesme] (
    [id] INT NOT NULL IDENTITY(1,1),
    [barkod_kodu] NVARCHAR(10) NOT NULL,
    [siparis_no] NVARCHAR(50) NOT NULL,
    [model_kod] NVARCHAR(25) NOT NULL,
    [renk_kod] NVARCHAR(25) NOT NULL,
    [beden] NVARCHAR(20) NOT NULL,
    [kumas_kod] NVARCHAR(25) NOT NULL,
    [kumas_renk_kod] NVARCHAR(25) NOT NULL,
    [model_ad] NVARCHAR(200),
    [renk_ad] NVARCHAR(100),
    [kumas_ad] NVARCHAR(200),
    [kumas_renk_ad] NVARCHAR(100),
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [barkod_eslesme_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [barkod_eslesme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [barkod_eslesme_barkod_kodu_key] UNIQUE NONCLUSTERED ([barkod_kodu])
);

-- CreateTable
CREATE TABLE [dbo].[kalite_kontrol] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_no] VARCHAR(50) NOT NULL,
    [is_emri_no] VARCHAR(100),
    [is_emri_id] INT,
    [fis_tarihi] DATETIME2 NOT NULL,
    [aciklama] VARCHAR(1000),
    [belge_adi] VARCHAR(200),
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [cari_hesap_id] INT,
    [depo_id] INT,
    [irsaliye_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kalite_kontrol_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kalite_kontrol_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kalite_kontrol_fis_no_key] UNIQUE NONCLUSTERED ([fis_no])
);

-- CreateTable
CREATE TABLE [dbo].[is_emri] (
    [id] INT NOT NULL IDENTITY(1,1),
    [is_emri_no] VARCHAR(100) NOT NULL,
    [aciklama] VARCHAR(1000),
    [siparis_no] VARCHAR(50),
    [musteri_siparis_no] VARCHAR(50),
    [baslangic_tarihi] DATETIME2,
    [bitis_tarihi] DATETIME2,
    [durum] VARCHAR(50),
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [is_emri_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [is_emri_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [is_emri_is_emri_no_key] UNIQUE NONCLUSTERED ([is_emri_no])
);

-- CreateTable
CREATE TABLE [dbo].[is_emri_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [is_emri_id] INT NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [is_emri_kalem_sira_df] DEFAULT 0,
    [siparis_no] VARCHAR(50),
    [malzeme_id] INT,
    [malzeme_kod] VARCHAR(50),
    [malzeme_ad] VARCHAR(255),
    [kg] DECIMAL(18,4),
    [mt] DECIMAL(18,4),
    [adet] DECIMAL(18,4),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [is_emri_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [is_emri_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[kalite_kontrol_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fis_id] INT NOT NULL,
    [barkod] VARCHAR(100),
    [malzeme_id] INT,
    [net_agirlik] DECIMAL(18,4),
    [net_metre] DECIMAL(18,4),
    [adet] INT,
    [hata_miktar] INT,
    [aciklama] VARCHAR(1000),
    [is_emri_no] VARCHAR(100),
    [is_emri_kg] DECIMAL(18,4),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kalite_kontrol_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kalite_kontrol_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hata_tanim] (
    [id] INT NOT NULL IDENTITY(1,1),
    [hata_kodu] VARCHAR(50) NOT NULL,
    [hata_adi] VARCHAR(200) NOT NULL,
    [ozel_kod] VARCHAR(100),
    [kullanimda] BIT NOT NULL CONSTRAINT [hata_tanim_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [hata_tanim_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [hata_tanim_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [hata_tanim_hata_kodu_key] UNIQUE NONCLUSTERED ([hata_kodu])
);

-- CreateTable
CREATE TABLE [dbo].[kalite_kontrol_hata] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kalem_id] INT NOT NULL,
    [hata_kodu] VARCHAR(50) NOT NULL,
    [hata_adi] VARCHAR(200) NOT NULL,
    [miktar] INT CONSTRAINT [kalite_kontrol_hata_miktar_df] DEFAULT 1,
    [aciklama] VARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kalite_kontrol_hata_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kalite_kontrol_hata_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[renk] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(200) NOT NULL,
    [tip] INT NOT NULL CONSTRAINT [renk_tip_df] DEFAULT 1,
    [aciklama] VARCHAR(1000),
    [renk] VARCHAR(20),
    [cari_kodu] VARCHAR(50),
    [talep_tarihi] DATETIME2,
    [okey_tarihi] DATETIME2,
    [fiyat] DECIMAL(18,4),
    [doviz_cinsi] VARCHAR(10),
    [kullanimda] BIT NOT NULL CONSTRAINT [renk_kullanimda_df] DEFAULT 1,
    [tarih] DATE,
    [ozel_kod] VARCHAR(50),
    [pantone_no] VARCHAR(50),
    [renk_turu] VARCHAR(50),
    [parent_renk_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [renk_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [renk_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [renk_kod_tip_key] UNIQUE NONCLUSTERED ([kod],[tip])
);

-- CreateTable
CREATE TABLE [dbo].[beden] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(20) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [beden_sira_df] DEFAULT 0,
    [kullanimda] BIT NOT NULL CONSTRAINT [beden_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [beden_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [beden_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [beden_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[malzeme_beden] (
    [id] INT NOT NULL IDENTITY(1,1),
    [malzeme_id] INT NOT NULL,
    [beden_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_beden_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [malzeme_beden_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [malzeme_beden_malzeme_id_beden_id_key] UNIQUE NONCLUSTERED ([malzeme_id],[beden_id])
);

-- CreateTable
CREATE TABLE [dbo].[model_recete] (
    [id] INT NOT NULL IDENTITY(1,1),
    [malzeme_id] INT NOT NULL,
    [aciklama] VARCHAR(500),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [model_recete_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [model_recete_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[recete_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [recete_id] INT NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [recete_kalem_sira_df] DEFAULT 0,
    [tip] INT,
    [malzeme_id] INT,
    [birim_fiyat] DECIMAL(18,4),
    [doviz_cinsi] VARCHAR(10),
    [aciklama] VARCHAR(500),
    [islem] VARCHAR(100),
    [variant_1] VARCHAR(100),
    [variant_2] VARCHAR(100),
    [susleme_secimi] VARCHAR(200),
    [kesilecek] BIT,
    [ana_kumas] VARCHAR(200),
    [tedarik_hesaplanmayacak] BIT,
    [kullanim_yeri] VARCHAR(200),
    [miktar_bolen] BIT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [recete_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [recete_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[recete_olcu] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kalem_id] INT NOT NULL,
    [beden_id] INT NOT NULL,
    [metraj] DECIMAL(18,4),
    [en] DECIMAL(18,4),
    [boy] DECIMAL(18,4),
    [miktar] DECIMAL(18,4),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [recete_olcu_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [recete_olcu_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [recete_olcu_kalem_id_beden_id_key] UNIQUE NONCLUSTERED ([kalem_id],[beden_id])
);

-- CreateTable
CREATE TABLE [dbo].[kumas_grup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [kumas_grup_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [kumas_grup_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [kumas_grup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [kumas_grup_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[malzeme_kumas_grup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [malzeme_id] INT NOT NULL,
    [kumas_grup_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_kumas_grup_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [malzeme_kumas_grup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [malzeme_kumas_grup_malzeme_id_kumas_grup_id_key] UNIQUE NONCLUSTERED ([malzeme_id],[kumas_grup_id])
);

-- CreateTable
CREATE TABLE [dbo].[gtip] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] VARCHAR(50) NOT NULL,
    [ad] VARCHAR(500) NOT NULL,
    [kullanimda] BIT NOT NULL CONSTRAINT [gtip_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [gtip_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [gtip_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [gtip_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[aksesuar_tipi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(200) NOT NULL,
    [on_ek] VARCHAR(20),
    [kullanimda] BIT NOT NULL CONSTRAINT [aksesuar_tipi_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [aksesuar_tipi_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [aksesuar_tipi_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[fason_tipi] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(200) NOT NULL,
    [kategoriler] VARCHAR(200),
    [kullanimda] BIT NOT NULL CONSTRAINT [fason_tipi_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fason_tipi_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [fason_tipi_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[malzeme_fiyat] (
    [id] INT NOT NULL IDENTITY(1,1),
    [malzeme_id] INT NOT NULL,
    [kod] VARCHAR(50),
    [aciklama] VARCHAR(500),
    [tarih] DATE,
    [beden_id] INT,
    [doviz_cinsi] VARCHAR(10),
    [fiyat] DECIMAL(18,4),
    [doviz_kuru] DECIMAL(18,6),
    [baslangic] DATE,
    [bitis] DATE,
    [kullanimda] BIT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_fiyat_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [malzeme_fiyat_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[malzeme_ek] (
    [id] INT NOT NULL IDENTITY(1,1),
    [malzeme_id] INT NOT NULL,
    [dosya_adi] VARCHAR(500) NOT NULL,
    [mimetype] VARCHAR(100) NOT NULL,
    [boyut] INT NOT NULL,
    [data] VARBINARY(max) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [malzeme_ek_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [malzeme_ek_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[doviz] (
    [kod] VARCHAR(10) NOT NULL,
    [alt_kod] VARCHAR(50),
    [ad] VARCHAR(200) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [doviz_sira_df] DEFAULT 0,
    [resim] VARCHAR(500),
    [kullanimda] BIT NOT NULL CONSTRAINT [doviz_kullanimda_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [doviz_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [doviz_pkey] PRIMARY KEY CLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[form_sablonlari] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] NVARCHAR(50) NOT NULL,
    [ad] NVARCHAR(200) NOT NULL,
    [ekran_turu] NVARCHAR(100) NOT NULL,
    [layout_json] NVARCHAR(max) NOT NULL,
    [aktif] BIT NOT NULL CONSTRAINT [form_sablonlari_aktif_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [form_sablonlari_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [form_sablonlari_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [form_sablonlari_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[siparis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_no] VARCHAR(50) NOT NULL,
    [ozel_kod] VARCHAR(50),
    [numarator_id] INT,
    [musteri_order_no] VARCHAR(50),
    [tarih] DATETIME2 NOT NULL,
    [isteme_tarihi] DATETIME2,
    [m_isteme_tarihi] DATETIME2,
    [kesim_fazlasi] VARCHAR(50),
    [musteri_temsilcisi] VARCHAR(200),
    [toplam_tutar] DECIMAL(18,2),
    [toplam_doviz] VARCHAR(10),
    [onaylandi] BIT NOT NULL CONSTRAINT [siparis_onaylandi_df] DEFAULT 0,
    [tamamlandi] BIT NOT NULL CONSTRAINT [siparis_tamamlandi_df] DEFAULT 0,
    [durum] VARCHAR(20) NOT NULL CONSTRAINT [siparis_durum_df] DEFAULT 'acik',
    [kayit_yapan] VARCHAR(100),
    [kayit_tarihi] DATETIME2,
    [guncelleyen] VARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    [cari_hesap_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [siparis_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [siparis_siparis_no_key] UNIQUE NONCLUSTERED ([siparis_no])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_kalem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_id] INT NOT NULL,
    [malzeme_id] INT,
    [aciklama] NVARCHAR(1000),
    [ozel_kod] VARCHAR(50),
    [doviz_cinsi] VARCHAR(10),
    [doviz_fiyati] DECIMAL(18,4),
    [doviz_kuru] DECIMAL(18,6),
    [fiyat] DECIMAL(18,4),
    [miktar] DECIMAL(18,4),
    [tutar] DECIMAL(18,2),
    [sira] INT NOT NULL CONSTRAINT [siparis_kalem_sira_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_kalem_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [siparis_kalem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_renk] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_kalem_id] INT NOT NULL,
    [ozel_kod] VARCHAR(50),
    [musteri_order_no] VARCHAR(50),
    [part_order_no] VARCHAR(50),
    [aciklama] NVARCHAR(1000),
    [isteme_tarihi] DATETIME2,
    [fiyat] DECIMAL(18,4),
    [kesim_uretim] VARCHAR(100),
    [lot] DECIMAL(18,4),
    [lot_toplami] DECIMAL(18,2),
    [toplam] DECIMAL(18,2),
    [genel_toplam] DECIMAL(18,2),
    [sira] INT NOT NULL CONSTRAINT [siparis_renk_sira_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_renk_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [siparis_renk_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_renk_kumas_grup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_renk_id] INT NOT NULL,
    [kumas_grup_id] INT NOT NULL,
    [renk_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_renk_kumas_grup_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [siparis_renk_kumas_grup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [siparis_renk_kumas_grup_siparis_renk_id_kumas_grup_id_key] UNIQUE NONCLUSTERED ([siparis_renk_id],[kumas_grup_id])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_renk_beden] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_renk_id] INT NOT NULL,
    [beden_id] INT NOT NULL,
    [miktar] DECIMAL(18,4),
    [fiyat] DECIMAL(18,4),
    [aciklama] NVARCHAR(1000),
    [barkod] VARCHAR(100),
    [sira] INT NOT NULL CONSTRAINT [siparis_renk_beden_sira_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_renk_beden_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [siparis_renk_beden_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [siparis_renk_beden_siparis_renk_id_beden_id_key] UNIQUE NONCLUSTERED ([siparis_renk_id],[beden_id])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_sticker] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_renk_beden_id] INT NOT NULL,
    [sira] INT NOT NULL,
    [deger] NVARCHAR(200),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_sticker_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [siparis_sticker_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [siparis_sticker_siparis_renk_beden_id_sira_key] UNIQUE NONCLUSTERED ([siparis_renk_beden_id],[sira])
);

-- CreateTable
CREATE TABLE [dbo].[siparis_aciklama] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_id] INT NOT NULL,
    [tip] VARCHAR(20) NOT NULL,
    [metin] NVARCHAR(max),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [siparis_aciklama_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [siparis_aciklama_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [siparis_aciklama_siparis_id_tip_key] UNIQUE NONCLUSTERED ([siparis_id],[tip])
);

-- CreateTable
CREATE TABLE [dbo].[tedarik_ihtiyac] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siparis_id] INT NOT NULL,
    [siparis_kalem_id] INT NOT NULL,
    [recete_kalem_id] INT,
    [malzeme_id] INT NOT NULL,
    [malzeme_kod] NVARCHAR(50) NOT NULL,
    [malzeme_ad] NVARCHAR(200) NOT NULL,
    [kumas_grup_id] INT,
    [kumas_grup_kod] NVARCHAR(50),
    [renk_id] INT,
    [renk_kod] NVARCHAR(50),
    [renk_ad] NVARCHAR(200),
    [brut_miktar] DECIMAL(18,4) NOT NULL,
    [net_miktar] DECIMAL(18,4) NOT NULL,
    [birim] NVARCHAR(20) NOT NULL CONSTRAINT [tedarik_ihtiyac_birim_df] DEFAULT 'mt',
    [tip] NVARCHAR(20) NOT NULL CONSTRAINT [tedarik_ihtiyac_tip_df] DEFAULT 'kumas',
    [durum] NVARCHAR(20) NOT NULL CONSTRAINT [tedarik_ihtiyac_durum_df] DEFAULT 'hesaplandi',
    [aciklama] NVARCHAR(max),
    [kayit_yapan] NVARCHAR(100),
    [kayit_tarihi] DATETIME2 NOT NULL CONSTRAINT [tedarik_ihtiyac_kayit_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleyen] NVARCHAR(100),
    [guncelleme_tarihi] DATETIME2,
    CONSTRAINT [tedarik_ihtiyac_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[doviz_kuru] (
    [id] INT NOT NULL IDENTITY(1,1),
    [tarih] DATE NOT NULL,
    [doviz_kodu] VARCHAR(10) NOT NULL,
    [alis_kuru] DECIMAL(18,6) NOT NULL,
    [satis_kuru] DECIMAL(18,6) NOT NULL,
    [efektif_alis] DECIMAL(18,6),
    [efektif_satis] DECIMAL(18,6),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [doviz_kuru_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [doviz_kuru_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [doviz_kuru_tarih_doviz_kodu_key] UNIQUE NONCLUSTERED ([tarih],[doviz_kodu])
);

-- CreateTable
CREATE TABLE [dbo].[logo] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] VARCHAR(100) NOT NULL,
    [dosya_yolu] VARCHAR(500) NOT NULL,
    [dosya] VARBINARY(max),
    [mimetype] VARCHAR(100) NOT NULL,
    [boyut] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [logo_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [logo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [logo_ad_key] UNIQUE NONCLUSTERED ([ad])
);

-- CreateTable
CREATE TABLE [dbo].[sablon] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ad] NVARCHAR(100) NOT NULL,
    [ekran_adi] NVARCHAR(100) NOT NULL,
    [html_icerik] NVARCHAR(max) NOT NULL,
    [sayfa_en] INT NOT NULL CONSTRAINT [sablon_sayfa_en_df] DEFAULT 210,
    [sayfa_boy] INT NOT NULL CONSTRAINT [sablon_sayfa_boy_df] DEFAULT 297,
    [yon] NVARCHAR(10) NOT NULL CONSTRAINT [sablon_yon_df] DEFAULT 'dikey',
    [ust_bosluk] INT NOT NULL CONSTRAINT [sablon_ust_bosluk_df] DEFAULT 10,
    [alt_bosluk] INT NOT NULL CONSTRAINT [sablon_alt_bosluk_df] DEFAULT 10,
    [sol_bosluk] INT NOT NULL CONSTRAINT [sablon_sol_bosluk_df] DEFAULT 15,
    [sag_bosluk] INT NOT NULL CONSTRAINT [sablon_sag_bosluk_df] DEFAULT 15,
    [alt_bilgi] BIT NOT NULL CONSTRAINT [sablon_alt_bilgi_df] DEFAULT 1,
    [aktif] BIT NOT NULL CONSTRAINT [sablon_aktif_df] DEFAULT 1,
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [sablon_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme_tarihi] DATETIME2,
    CONSTRAINT [sablon_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sablon_ekran_adi_ad_key] UNIQUE NONCLUSTERED ([ekran_adi],[ad])
);

-- CreateTable
CREATE TABLE [dbo].[sablon_sorgu] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sablon_id] INT NOT NULL,
    [ad] NVARCHAR(100) NOT NULL,
    [sql_icerik] NVARCHAR(max) NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [sablon_sorgu_sira_df] DEFAULT 0,
    CONSTRAINT [sablon_sorgu_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hizmet_talep] (
    [id] INT NOT NULL IDENTITY(1,1),
    [baslik] NVARCHAR(200) NOT NULL,
    [aciklama] NVARCHAR(4000),
    [durum] NVARCHAR(50) NOT NULL CONSTRAINT [hizmet_talep_durum_df] DEFAULT 'Açık',
    [oncelik] NVARCHAR(50) NOT NULL CONSTRAINT [hizmet_talep_oncelik_df] DEFAULT 'Normal',
    [tarih] DATETIME2 NOT NULL CONSTRAINT [hizmet_talep_tarih_df] DEFAULT CURRENT_TIMESTAMP,
    [kullanici] NVARCHAR(100),
    [gorusme_kisi] NVARCHAR(200),
    [kapanis_tarihi] DATETIME2 NOT NULL CONSTRAINT [hizmet_talep_kapanis_tarihi_df] DEFAULT '1900-01-01',
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [hizmet_talep_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    [guncelleme_tarihi] DATETIME2,
    CONSTRAINT [hizmet_talep_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hizmet_talep_not] (
    [id] INT NOT NULL IDENTITY(1,1),
    [hizmet_talep_id] INT NOT NULL,
    [icerik] NVARCHAR(4000) NOT NULL,
    [gorusme_tarihi] DATETIME2,
    [iletisim_kisi] NVARCHAR(200),
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [hizmet_talep_not_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [hizmet_talep_not_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hizmet_talep_dosya] (
    [id] INT NOT NULL IDENTITY(1,1),
    [hizmet_talep_id] INT NOT NULL,
    [hizmet_talep_not_id] INT,
    [dosya_adi] NVARCHAR(255) NOT NULL,
    [dosya_yolu] NVARCHAR(500) NOT NULL,
    [olusturma_tarihi] DATETIME2 NOT NULL CONSTRAINT [hizmet_talep_dosya_olusturma_tarihi_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [hizmet_talep_dosya_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[islem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] NVARCHAR(50) NOT NULL,
    [ad] NVARCHAR(200) NOT NULL,
    [birim] NVARCHAR(20),
    [sira] INT NOT NULL CONSTRAINT [islem_sira_df] DEFAULT 0,
    [aktif] BIT NOT NULL CONSTRAINT [islem_aktif_df] DEFAULT 1,
    CONSTRAINT [islem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [islem_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[rota] (
    [id] INT NOT NULL IDENTITY(1,1),
    [kod] NVARCHAR(50) NOT NULL,
    [ad] NVARCHAR(200) NOT NULL,
    [ozel_kod] NVARCHAR(50),
    [hizmet_kodu] NVARCHAR(50),
    [kullanimda] BIT NOT NULL CONSTRAINT [rota_kullanimda_df] DEFAULT 1,
    CONSTRAINT [rota_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [rota_kod_key] UNIQUE NONCLUSTERED ([kod])
);

-- CreateTable
CREATE TABLE [dbo].[rota_operasyon] (
    [id] INT NOT NULL IDENTITY(1,1),
    [rota_id] INT NOT NULL,
    [sira] INT NOT NULL CONSTRAINT [rota_operasyon_sira_df] DEFAULT 0,
    [operasyon_kodu] NVARCHAR(50) NOT NULL,
    [operasyon_adi] NVARCHAR(200),
    [varsayilan_yer] NVARCHAR(200),
    [birim] NVARCHAR(20),
    [birim_fiyat] DECIMAL(18,2),
    CONSTRAINT [rota_operasyon_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [malzeme_created_at_idx] ON [dbo].[malzeme]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ozellik_kodlama_kategori_idx] ON [dbo].[ozellik_kodlama]([kategori]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cari_hesap_vergi_no_idx] ON [dbo].[cari_hesap]([vergi_no]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cari_hesap_created_at_idx] ON [dbo].[cari_hesap]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [is_emri_kalem_is_emri_id_idx] ON [dbo].[is_emri_kalem]([is_emri_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [malzeme_fiyat_malzeme_id_idx] ON [dbo].[malzeme_fiyat]([malzeme_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [malzeme_ek_malzeme_id_idx] ON [dbo].[malzeme_ek]([malzeme_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [siparis_kalem_siparis_id_idx] ON [dbo].[siparis_kalem]([siparis_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [siparis_renk_siparis_kalem_id_idx] ON [dbo].[siparis_renk]([siparis_kalem_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [siparis_renk_beden_siparis_renk_id_idx] ON [dbo].[siparis_renk_beden]([siparis_renk_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_tedarik_ihtiyac_siparis] ON [dbo].[tedarik_ihtiyac]([siparis_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_tedarik_ihtiyac_sip_kalem] ON [dbo].[tedarik_ihtiyac]([siparis_kalem_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_tedarik_ihtiyac_malzeme] ON [dbo].[tedarik_ihtiyac]([malzeme_id]);

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_marka_id_fkey] FOREIGN KEY ([marka_id]) REFERENCES [dbo].[marka]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_uretici_firma_kodu_fkey] FOREIGN KEY ([uretici_firma_kodu]) REFERENCES [dbo].[cari_hesap]([kod]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_grup_id_fkey] FOREIGN KEY ([grup_id]) REFERENCES [dbo].[grup]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_kumas_turu_id_fkey] FOREIGN KEY ([kumas_turu_id]) REFERENCES [dbo].[ozellik_kodlama]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_numarator_id_fkey] FOREIGN KEY ([numarator_id]) REFERENCES [dbo].[numarator]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_aksesuar_tipi_id_fkey] FOREIGN KEY ([aksesuar_tipi_id]) REFERENCES [dbo].[aksesuar_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_iplik_no_id_fkey] FOREIGN KEY ([iplik_no_id]) REFERENCES [dbo].[ozellik_kodlama]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_iplik_cinsi_id_fkey] FOREIGN KEY ([iplik_cinsi_id]) REFERENCES [dbo].[ozellik_kodlama]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme] ADD CONSTRAINT [malzeme_iplik_kompozisyon_id_fkey] FOREIGN KEY ([iplik_kompozisyon_id]) REFERENCES [dbo].[ozellik_kodlama]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye] ADD CONSTRAINT [irsaliye_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye] ADD CONSTRAINT [irsaliye_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye] ADD CONSTRAINT [irsaliye_fason_tipi_id_fkey] FOREIGN KEY ([fason_tipi_id]) REFERENCES [dbo].[fason_tipi]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem] ADD CONSTRAINT [irsaliye_kalem_irsaliye_id_fkey] FOREIGN KEY ([irsaliye_id]) REFERENCES [dbo].[irsaliye]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem] ADD CONSTRAINT [irsaliye_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem] ADD CONSTRAINT [irsaliye_kalem_varyant1_renk_id_fkey] FOREIGN KEY ([varyant1_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[irsaliye_kalem] ADD CONSTRAINT [irsaliye_kalem_varyant2_renk_id_fkey] FOREIGN KEY ([varyant2_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol] ADD CONSTRAINT [kalite_kontrol_is_emri_id_fkey] FOREIGN KEY ([is_emri_id]) REFERENCES [dbo].[is_emri]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol] ADD CONSTRAINT [kalite_kontrol_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol] ADD CONSTRAINT [kalite_kontrol_depo_id_fkey] FOREIGN KEY ([depo_id]) REFERENCES [dbo].[depo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol] ADD CONSTRAINT [kalite_kontrol_irsaliye_id_fkey] FOREIGN KEY ([irsaliye_id]) REFERENCES [dbo].[irsaliye]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[is_emri_kalem] ADD CONSTRAINT [is_emri_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[is_emri_kalem] ADD CONSTRAINT [is_emri_kalem_is_emri_id_fkey] FOREIGN KEY ([is_emri_id]) REFERENCES [dbo].[is_emri]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD CONSTRAINT [kalite_kontrol_kalem_fis_id_fkey] FOREIGN KEY ([fis_id]) REFERENCES [dbo].[kalite_kontrol]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol_kalem] ADD CONSTRAINT [kalite_kontrol_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[kalite_kontrol_hata] ADD CONSTRAINT [kalite_kontrol_hata_kalem_id_fkey] FOREIGN KEY ([kalem_id]) REFERENCES [dbo].[kalite_kontrol_kalem]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[renk] ADD CONSTRAINT [renk_cari_kodu_fkey] FOREIGN KEY ([cari_kodu]) REFERENCES [dbo].[cari_hesap]([kod]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[renk] ADD CONSTRAINT [renk_parent_renk_id_fkey] FOREIGN KEY ([parent_renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_beden] ADD CONSTRAINT [malzeme_beden_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_beden] ADD CONSTRAINT [malzeme_beden_beden_id_fkey] FOREIGN KEY ([beden_id]) REFERENCES [dbo].[beden]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[model_recete] ADD CONSTRAINT [model_recete_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[recete_kalem] ADD CONSTRAINT [recete_kalem_recete_id_fkey] FOREIGN KEY ([recete_id]) REFERENCES [dbo].[model_recete]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[recete_kalem] ADD CONSTRAINT [recete_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recete_olcu] ADD CONSTRAINT [recete_olcu_kalem_id_fkey] FOREIGN KEY ([kalem_id]) REFERENCES [dbo].[recete_kalem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[recete_olcu] ADD CONSTRAINT [recete_olcu_beden_id_fkey] FOREIGN KEY ([beden_id]) REFERENCES [dbo].[beden]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_kumas_grup] ADD CONSTRAINT [malzeme_kumas_grup_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_kumas_grup] ADD CONSTRAINT [malzeme_kumas_grup_kumas_grup_id_fkey] FOREIGN KEY ([kumas_grup_id]) REFERENCES [dbo].[kumas_grup]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_fiyat] ADD CONSTRAINT [malzeme_fiyat_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[malzeme_ek] ADD CONSTRAINT [malzeme_ek_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis] ADD CONSTRAINT [siparis_numarator_id_fkey] FOREIGN KEY ([numarator_id]) REFERENCES [dbo].[numarator]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis] ADD CONSTRAINT [siparis_cari_hesap_id_fkey] FOREIGN KEY ([cari_hesap_id]) REFERENCES [dbo].[cari_hesap]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_kalem] ADD CONSTRAINT [siparis_kalem_siparis_id_fkey] FOREIGN KEY ([siparis_id]) REFERENCES [dbo].[siparis]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_kalem] ADD CONSTRAINT [siparis_kalem_malzeme_id_fkey] FOREIGN KEY ([malzeme_id]) REFERENCES [dbo].[malzeme]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk] ADD CONSTRAINT [siparis_renk_siparis_kalem_id_fkey] FOREIGN KEY ([siparis_kalem_id]) REFERENCES [dbo].[siparis_kalem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk_kumas_grup] ADD CONSTRAINT [siparis_renk_kumas_grup_siparis_renk_id_fkey] FOREIGN KEY ([siparis_renk_id]) REFERENCES [dbo].[siparis_renk]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk_kumas_grup] ADD CONSTRAINT [siparis_renk_kumas_grup_kumas_grup_id_fkey] FOREIGN KEY ([kumas_grup_id]) REFERENCES [dbo].[kumas_grup]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk_kumas_grup] ADD CONSTRAINT [siparis_renk_kumas_grup_renk_id_fkey] FOREIGN KEY ([renk_id]) REFERENCES [dbo].[renk]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk_beden] ADD CONSTRAINT [siparis_renk_beden_siparis_renk_id_fkey] FOREIGN KEY ([siparis_renk_id]) REFERENCES [dbo].[siparis_renk]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_renk_beden] ADD CONSTRAINT [siparis_renk_beden_beden_id_fkey] FOREIGN KEY ([beden_id]) REFERENCES [dbo].[beden]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_sticker] ADD CONSTRAINT [siparis_sticker_siparis_renk_beden_id_fkey] FOREIGN KEY ([siparis_renk_beden_id]) REFERENCES [dbo].[siparis_renk_beden]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[siparis_aciklama] ADD CONSTRAINT [siparis_aciklama_siparis_id_fkey] FOREIGN KEY ([siparis_id]) REFERENCES [dbo].[siparis]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[doviz_kuru] ADD CONSTRAINT [doviz_kuru_doviz_kodu_fkey] FOREIGN KEY ([doviz_kodu]) REFERENCES [dbo].[doviz]([kod]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sablon_sorgu] ADD CONSTRAINT [sablon_sorgu_sablon_id_fkey] FOREIGN KEY ([sablon_id]) REFERENCES [dbo].[sablon]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[hizmet_talep_not] ADD CONSTRAINT [hizmet_talep_not_hizmet_talep_id_fkey] FOREIGN KEY ([hizmet_talep_id]) REFERENCES [dbo].[hizmet_talep]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[hizmet_talep_dosya] ADD CONSTRAINT [hizmet_talep_dosya_hizmet_talep_id_fkey] FOREIGN KEY ([hizmet_talep_id]) REFERENCES [dbo].[hizmet_talep]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[hizmet_talep_dosya] ADD CONSTRAINT [hizmet_talep_dosya_hizmet_talep_not_id_fkey] FOREIGN KEY ([hizmet_talep_not_id]) REFERENCES [dbo].[hizmet_talep_not]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rota_operasyon] ADD CONSTRAINT [rota_operasyon_rota_id_fkey] FOREIGN KEY ([rota_id]) REFERENCES [dbo].[rota]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

