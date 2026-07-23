<Modal
    title="Kalem Ölçümlerini Düzenle"
    visible={olcuModalOpen}
    onCancel={closeOlcuModal}
    footer={null}
  >
    {olcuModalKalem && (
      <div className="!overflow-y-auto !overflow-x-hidden !h-full !p-3">
        <div className="!border !border-gray-200 !rounded-sm">
          <div className="!px-3 !py-2 !border-b !border-gray-200 !bg-[#f9fafb]">
            <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">
              {olcuModalKalem.malzeme?.kod} - {olcuModalKalem.malzeme?.ad} — Ölçüler
            </span>
          </div>
          <div className="!p-3">
            <div className="!flex !gap-4 !mb-3">
              <FormField label="Malzeme">
                                <SearchableMalzemeSelect
                                  value={olcuModalKalem?.malzemeId ?? null}
                                  onChange={(mid, rec) => {
                                    if (rec) {
                                      await modelReceteApi.updateKalem(olcuModalKalem!.id, { malzemeId: rec.id })
                                      await loadRecete()
                                    }
                                  }}
                                  widthClass="!w-[220px]"
                                  placeholder="Malzeme seçin..."
                                />
                              </div>
                        <FormField label="Birim Fiyat">
                          <InputNumber size="small" min={0} step={0.01} value={kalem.birimFiyat ?? null} onChange={async (v) => { await modelReceteApi.updateKalem(olcuModalKalem!.id, { birimFiyat: v ?? undefined }); await loadRecete() }} className="!w-[140px] !text-[11px]" />
                        </FormField>
                        <FormField label="Döviz">
                          <Select size="small" value={kalem.dovizCinsi ?? 'TRY'} onChange={async (v) => { await modelReceteApi.updateKalem(olcuModalKalem!.id, { dovizCinsi: v }); await loadRecete() }} className="!w-[80px] !text-[11px]" options={[{ value: 'TRY', label: 'TRY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
                        </FormField>
                      </div>
                      <table className="!w-full !text-[11px]">
                        <thead>
                          <tr className="!border-b !border-gray-200">
                            <th className="!text-left !py-1.5 !px-2 !font-semibold !text-[#6b7280]">Beden</th>
                            <th className="!text-right !py-1.5 !px-2 !font-semibold !text-[#6b7280]">Metraj</th>
                            <th className="!text-right !py-1.5 !px-2 !font-semibold !text-[#6b7280]">En</th>
                            <th className="!text-right !py-1.5 !px-2 !font-semibold !text-[#6b7280]">Boy</th>
                            <th className="!text-right !py-1.5 !px-2 !font-semibold !text-[#6b7280]">Miktar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modelBedenler.filter((b) => b.bedenId === olcuModalKalem?.bedenId).map((b) => {
                            const olcu = olcuModalKalem?.olculer?.find((o) => o.bedenId === b.bedenId)
                            return (
                              <tr key={beden.id} className="!border-b !border-gray-100 hover:!bg-[#f9fafb]">
                                <td className="!py-1.5 !px-2 !font-medium">{beden.kod}</td>
                                <td className="!py-1.5 !px-2 !text-right">
                                  <InputNumber size="small" min={0} step={0.01} value={olcu?.metraj ?? null} onChange={(v) => handleOlcuChange(olcuModalKalem!.id, beden.id, 'metraj', v)} className="!w-20 !text-[11px]" controls={false} />
                                </td>
                                <td className="!py-1.5 !px-2 !text-right">
                                  <InputNumber size="small" min={0} value={olcu?.en ?? null} onChange={(v) => handleOlcuChange(olcuModalKalem!.id, beden.id, 'en', v)} className="!w-20 !text-[11px]" controls={false} />
                                </td>
                                <td className="!py-1.5 !px-2 !text-right">
                                  <InputNumber size="small" min={0} value={olcu?.boy ?? null} onChange={(v) => handleOlcuChange(olcuModalKalmi!.id, beden.id, 'boy', v)} className="!w-20 !text-[11px]" controls={false} />
                                </td>
                                <td className="!py-1.5 !px-2 !text-right">
                                  <InputNumber size="small" min={0} step={0.01} value={olcu?.miktar ?? null} onChange={(v) => handleOlcuChange(olcuModalKalem!.id, beden.id, 'miktar', v)} className="!w-20 !text-[11px]" controls={false} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </div>
            </div>
          )
        </div>
      )
    },