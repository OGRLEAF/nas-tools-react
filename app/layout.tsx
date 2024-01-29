import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import DefaultLayout from './components/layout'
import { Suspense, useEffect } from 'react'
import { App, ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NASTOOL Lite',
  description: 'NASTOOL Lite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="zh">
      <body className={inter.className}>
        <ConfigProvider locale={zhCN}>
          <App>
            <Suspense fallback={<LoadingPage />}>
              <DefaultLayout>{children}</DefaultLayout>
            </Suspense>
          </App>
        </ConfigProvider>
      </body>
    </html >
  )
}


function LoadingPage() {
  return <Spin size="large" spinning>
    <div style={{height: "100vh", width: "100vw"}}></div>
    </Spin>
}