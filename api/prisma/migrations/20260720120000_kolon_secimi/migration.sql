-- CreateTable
CREATE TABLE kolon_secimi (
    id INT IDENTITY(1,1) NOT NULL,
    kullanici_id INT NOT NULL,
    ekran_adi NVARCHAR(100) NOT NULL,
    kolon_adi NVARCHAR(100) NOT NULL,
    gizli BIT NOT NULL CONSTRAINT df_kolon_secimi_gizli DEFAULT 0,
    genislik INT,
    sira INT,
    siralama_yon NVARCHAR(10),
    CONSTRAINT pk_kolon_secimi PRIMARY KEY (id),
    CONSTRAINT uq_kolon_secimi UNIQUE (kullanici_id, ekran_adi, kolon_adi)
);
