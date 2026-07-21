import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import './index.css'
import App from './App.tsx'
import { regulaTheme } from './theme/antdTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={regulaTheme}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
