'use client'

import { useState, useEffect } from 'react'
import { Select, Input, Button, Checkbox, Form, Typography, App } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { authApi, type KullaniciOption } from '@/lib/auth-api'
import { useAuth } from '@/context/AuthContext'

const { Title, Text } = Typography

export default function LoginPage() {
  const { login } = useAuth()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [kullanicilar, setKullanicilar] = useState<KullaniciOption[]>([])
  const [loading, setLoading] = useState(false)
  const [kullaniciHata, setKullaniciHata] = useState(false)

  useEffect(() => {
    authApi.kullanicilar()
      .then((list) => {
        setKullanicilar(list)
        setKullaniciHata(false)
      })
      .catch(() => setKullaniciHata(true))
  }, [])

  const handleSubmit = async (values: { kullaniciAdi: string; sifre: string; beniHatirlat?: boolean }) => {
    setLoading(true)
    try {
      await login(values.kullaniciAdi, values.sifre, values.beniHatirlat)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Giriş başarısız'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="!min-h-screen !flex !items-center !justify-center !bg-[#f0f0f0]">
      <div className="!w-full !max-w-[380px] !bg-white !rounded-sm !shadow-sm !p-6">
        <div className="!text-center !mb-6">
          <div className="!text-[22px] !font-bold !text-[#333] !tracking-tight">NAKOSAN</div>
          <div className="!text-[10px] !text-[#9ca3af] !uppercase !tracking-widest !mt-0.5">ERP Sistemi</div>
        </div>

        {kullaniciHata && (
          <div className="!text-[10px] !text-red-500 !text-center !mb-3 !bg-red-50 !py-1.5 !px-2 !rounded-sm">
            Kullanıcı listesi alınamadı. API sunucusunu kontrol edin.
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="kullaniciAdi" rules={[{ required: true, message: 'Kullanıcı seçin' }]}>
            <Select
              placeholder="Kullanıcı Adı"
              showSearch
              optionFilterProp="label"
              prefix={<UserOutlined className="!text-[#9ca3af]" />}
              options={kullanicilar.map((k) => ({
                label: `${k.girisKodu || k.kod} - ${k.ad}`,
                value: k.girisKodu || k.kod,
              }))}
              className="[&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-[#d9d9d9]"
            />
          </Form.Item>

          <Form.Item name="sifre" rules={[{ required: true, message: 'Şifre girin' }]}>
            <Input.Password
              placeholder="Şifre"
              prefix={<LockOutlined className="!text-[#9ca3af]" />}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined className="!text-[#9ca3af]" />
              }
              className="[&_.ant-input]:!rounded-sm"
            />
          </Form.Item>

          <Form.Item name="beniHatirlat" valuePropName="checked">
            <Checkbox className="!text-[11px] !text-[#6b7280]">Beni Hatırlat</Checkbox>
          </Form.Item>

          <div className="!flex !gap-2">
            <Button htmlType="submit" type="primary" loading={loading} className="!flex-1 !rounded-sm !h-9 !text-[12px]">
              Tamam
            </Button>
            <Button htmlType="reset" className="!rounded-sm !h-9 !text-[12px]">
              Vazgeç
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}
