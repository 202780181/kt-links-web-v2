/**
 * Vite 7 拆包配置 - 终极方案
 * 
 * 策略：让 Rollup 根据实际依赖关系自动分组，而不是强制指定chunk名
 * 这样可以避免循环依赖，同时保持合理的拆包
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))

const allDependencies: Record<string, string> = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

const getPackageVersion = (packageName: string): string => {
  const version = allDependencies[packageName]
  return version ? version.replace(/[\^~]/g, '') : 'unknown'
}

const getPackageNameFromId = (id: string): string | null => {
  if (!id.includes('node_modules')) return null

  const parts = id.split('node_modules/')
  if (parts.length < 2) return null

  const modulePath = parts[parts.length - 1]

  if (modulePath.startsWith('.pnpm/')) {
    const pnpmMatch = modulePath.match(/\.pnpm\/([^@/]+(?:@[^@/]+)?[^/]*)@[\d.]+/)
    if (pnpmMatch) {
      let pkgName = pnpmMatch[1]
      if (pkgName.includes('+')) {
        pkgName = pkgName.replace('+', '/')
      }
      return pkgName
    }
  }

  if (modulePath.startsWith('@')) {
    const scopedMatch = modulePath.match(/^(@[^/]+\/[^/]+)/)
    return scopedMatch ? scopedMatch[1] : null
  }

  const normalMatch = modulePath.match(/^([^/]+)/)
  return normalMatch ? normalMatch[1] : null
}

/**
 * Vite 7 最佳实践：简单的包名拆分
 * 
 * 不再尝试手动合并或指定固定名称，让每个包成为独立的 chunk
 * Rollup 会自动处理依赖关系和导入顺序
 */
export const manualChunks = (id: string): string | undefined => {
  if (!id.includes('node_modules')) {
    return undefined
  }

  const packageName = getPackageNameFromId(id)
  if (!packageName) {
    return undefined
  }

  // 🎯 简单策略：每个包独立一个 chunk，带版本号
  // 这样 Rollup 会自动处理依赖关系，不会产生循环依赖
  const version = getPackageVersion(packageName)
  const chunkName = packageName.replace('@', '').replace(/\//g, '-')
  
  return `vendor/${chunkName}-${version}`
}

/**
 * 文件命名规则
 */
export const chunkFileNames = (chunkInfo: any): string => {
  const chunkName = chunkInfo.name

  // vendor 目录的文件直接使用 chunk 名称（已经包含路径）
  if (chunkName && chunkName.startsWith('vendor/')) {
    return `${chunkName}.js`
  }

  // 其他文件按原有逻辑
  const facadeModuleId = chunkInfo.facadeModuleId
  if (facadeModuleId) {
    if (facadeModuleId.includes('/pages/')) {
      const pageName = facadeModuleId.split('/pages/')[1].split('/')[0]
      return `pages/${pageName}-[hash].js`
    }
    if (facadeModuleId.includes('/components/')) {
      return `components/[name].[hash].js`
    }
  }

  return `chunks/[name].[hash].js`
}

/**
 * 静态资源命名规则
 */
export const assetFileNames = (assetInfo: any): string => {
  if (!assetInfo.name) {
    return `assets/[name].[hash][extname]`
  }

  if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
    return `assets/media/[name].[hash][extname]`
  }
  if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
    return `assets/images/[name].[hash][extname]`
  }
  if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
    return `assets/fonts/[name].[hash][extname]`
  }
  return `assets/[name].[hash][extname]`
}

export default {
  manualChunks,
  chunkFileNames,
  assetFileNames,
}
