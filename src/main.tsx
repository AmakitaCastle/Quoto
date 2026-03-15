/**
 * 应用入口文件
 *
 * React 应用的启动点。
 * 使用 React 18 的 createRoot API 渲染根组件。
 *
 * @package src
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/**
 * 渲染应用到 DOM
 *
 * 在#root 元素中渲染 App 组件，使用 StrictMode 启用开发模式的额外检查。
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
