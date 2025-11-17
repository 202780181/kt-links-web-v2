/**
 * 上传第三方包到腾讯云 COS
 * 只上传 vendor/ 目录下的文件到 CDN
 */

import COS from 'cos-nodejs-sdk-v5'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 配置信息（从环境变量读取）
const config = {
  secretId: process.env.COS_SECRET_ID || '',
  secretKey: process.env.COS_SECRET_KEY || '',
  bucket: process.env.COS_BUCKET || '',
  region: process.env.COS_REGION || 'ap-guangzhou',
  cdnDomain: process.env.CDN_DOMAIN || '', // CDN 域名，如：https://cdn.example.com
}

// 验证配置
if (!config.secretId || !config.secretKey || !config.bucket) {
  console.error('❌ 缺少 COS 配置，请设置环境变量：')
  console.error('   COS_SECRET_ID')
  console.error('   COS_SECRET_KEY')
  console.error('   COS_BUCKET')
  console.error('   COS_REGION (可选，默认: ap-guangzhou)')
  console.error('   CDN_DOMAIN (可选)')
  process.exit(1)
}

// 初始化 COS 客户端
const cos = new COS({
  SecretId: config.secretId,
  SecretKey: config.secretKey,
})

// 计算文件 MD5
const getFileMD5 = (filePath: string): string => {
  const content = fs.readFileSync(filePath)
  return createHash('md5').update(content).digest('hex')
}

// 检查文件是否已存在于 COS
const checkFileExists = async (key: string, localMD5: string): Promise<boolean> => {
  try {
    const result = await cos.headObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
    })
    // 比较 ETag (去除引号)
    const remoteMD5 = result.ETag?.replace(/"/g, '')
    return remoteMD5 === localMD5
  } catch (error: any) {
    if (error.statusCode === 404) {
      return false
    }
    throw error
  }
}

// 上传单个文件到 COS
const uploadFile = async (localPath: string, cosKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: cosKey,
        Body: fs.createReadStream(localPath),
        ContentType: getContentType(localPath),
        CacheControl: 'max-age=31536000', // 1年缓存
      },
      (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      },
    )
  })
}

// 获取文件的 Content-Type
const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  const types: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  }
  return types[ext] || 'application/octet-stream'
}

// 获取所有需要上传的文件
const getFilesToUpload = (distDir: string): string[] => {
  const vendorDir = path.join(distDir, 'vendor')
  const files: string[] = []

  if (!fs.existsSync(vendorDir)) {
    console.warn('⚠️  vendor 目录不存在')
    return files
  }

  const walk = (dir: string) => {
    const items = fs.readdirSync(dir)
    items.forEach((item) => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else {
        files.push(fullPath)
      }
    })
  }

  walk(vendorDir)
  return files
}

// 主函数
const main = async () => {
  console.log('🚀 开始上传第三方包到腾讯云 COS...\n')

  const distDir = path.resolve(__dirname, '../dist')
  const files = getFilesToUpload(distDir)

  if (files.length === 0) {
    console.log('⚠️  没有找到需要上传的文件')
    return
  }

  console.log(`📦 找到 ${files.length} 个文件需要处理\n`)

  let uploadedCount = 0
  let skippedCount = 0
  let failedCount = 0

  // 上传文件
  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath)
    const cosKey = relativePath.replace(/\\/g, '/') // Windows 路径兼容
    const fileName = path.basename(filePath)
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(2)

    try {
      // 计算本地文件 MD5
      const localMD5 = getFileMD5(filePath)

      // 检查文件是否已存在
      const exists = await checkFileExists(cosKey, localMD5)

      if (exists) {
        console.log(`⏭️  ${fileName} (${fileSize} KB) - 已存在，跳过`)
        skippedCount++
      } else {
        await uploadFile(filePath, cosKey)
        console.log(`✅ ${fileName} (${fileSize} KB) - 上传成功`)
        uploadedCount++
      }
    } catch (error: any) {
      console.error(`❌ ${fileName} - 上传失败: ${error.message}`)
      failedCount++
    }
  }

  // 生成 CDN 映射文件
  const cdnMapping: Record<string, string> = {}
  files.forEach((filePath) => {
    const relativePath = path.relative(distDir, filePath)
    const cosKey = relativePath.replace(/\\/g, '/')
    const cdnUrl = config.cdnDomain
      ? `${config.cdnDomain}/${cosKey}`
      : `https://${config.bucket}.cos.${config.region}.myqcloud.com/${cosKey}`
    cdnMapping[relativePath] = cdnUrl
  })

  // 保存映射文件
  const mappingFile = path.join(distDir, 'cdn-mapping.json')
  fs.writeFileSync(mappingFile, JSON.stringify(cdnMapping, null, 2))

  console.log('\n' + '='.repeat(50))
  console.log('📊 上传统计:')
  console.log(`   ✅ 成功: ${uploadedCount}`)
  console.log(`   ⏭️  跳过: ${skippedCount}`)
  console.log(`   ❌ 失败: ${failedCount}`)
  console.log('='.repeat(50))

  if (config.cdnDomain) {
    console.log(`\n🌐 CDN 域名: ${config.cdnDomain}`)
  }
  console.log(`📄 CDN 映射文件: ${mappingFile}\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ 上传过程出错:', error)
  process.exit(1)
})

