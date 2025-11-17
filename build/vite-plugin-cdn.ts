/**
 * Vite 插件：将第三方包引用替换为 CDN 地址
 */

import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

interface CdnPluginOptions {
  cdnDomain?: string
  enabled?: boolean
}

export function cdnPlugin(options: CdnPluginOptions = {}): Plugin {
  const { cdnDomain, enabled = process.env.USE_CDN === 'true' } = options

  if (!enabled) {
    console.log('ℹ️  CDN 功能未启用')
    return {
      name: 'vite-plugin-cdn',
    }
  }

  if (!cdnDomain) {
    console.warn('⚠️  未设置 CDN 域名，将使用 COS 默认域名')
  }

  return {
    name: 'vite-plugin-cdn',

    // 在生成 HTML 后处理
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // 读取 CDN 映射文件
        const outputDir = typeof ctx.bundle?.dir === 'string' ? ctx.bundle.dir : 'dist'
        const mappingFile = path.join(outputDir, 'cdn-mapping.json')

        if (!fs.existsSync(mappingFile)) {
          console.warn('⚠️  未找到 CDN 映射文件，跳过 CDN 替换')
          return html
        }

        const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'))

        // 替换 vendor 文件的引用
        let modifiedHtml = html

        Object.entries(mapping).forEach(([localPath, cdnUrl]) => {
          // 处理 script 标签
          const scriptPattern = new RegExp(
            `<script[^>]*src=["']([^"']*${localPath.replace(/\//g, '\\/')})["'][^>]*>`,
            'g',
          )
          modifiedHtml = modifiedHtml.replace(scriptPattern, (match) => {
            return match.replace(localPath, cdnUrl)
          })

          // 处理 link 标签（如果有 CSS）
          const linkPattern = new RegExp(
            `<link[^>]*href=["']([^"']*${localPath.replace(/\//g, '\\/')})["'][^>]*>`,
            'g',
          )
          modifiedHtml = modifiedHtml.replace(linkPattern, (match) => {
            return match.replace(localPath, cdnUrl)
          })
        })

        if (modifiedHtml !== html) {
          console.log('✅ HTML 中的 vendor 引用已替换为 CDN 地址')
        }

        return modifiedHtml
      },
    },
  }
}

