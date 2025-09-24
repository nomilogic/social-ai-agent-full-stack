#!/usr/bin/env tsx
/**
 * Storage Analyzer - Detailed Storage Usage Analysis
 * 
 * This script analyzes Supabase storage usage without database dependencies
 */

import { serverSupabase } from '../supabaseClient.js'

interface FileInfo {
  name: string
  path: string
  size: number
  lastModified: string
  type: string
}

interface FolderStats {
  fileCount: number
  totalSize: number
  files: FileInfo[]
}

interface BucketStats {
  name: string
  totalFiles: number
  totalSize: number
  folders: Map<string, FolderStats>
}

class StorageAnalyzer {
  private bucketStats: BucketStats[] = []
  private totalFiles = 0
  private totalSize = 0

  async analyzeBuckets(): Promise<void> {
    console.log('📊 Analyzing Supabase Storage Usage...\n')

    try {
      // Get all buckets
      const { data: buckets, error } = await serverSupabase.storage.listBuckets()
      
      if (error) {
        throw new Error(`Failed to list buckets: ${error.message}`)
      }

      console.log(`Found ${buckets?.length || 0} storage buckets\n`)

      // Analyze each bucket
      for (const bucket of buckets || []) {
        console.log(`📂 Analyzing bucket: ${bucket.name}`)
        const stats = await this.analyzeBucket(bucket.name)
        this.bucketStats.push(stats)
        this.totalFiles += stats.totalFiles
        this.totalSize += stats.totalSize
        console.log(`   ✅ Complete: ${stats.totalFiles} files, ${this.formatSize(stats.totalSize)}\n`)
      }

      // Print detailed results
      this.printResults()

    } catch (error: any) {
      console.error('❌ Error analyzing storage:', error.message)
      process.exit(1)
    }
  }

  private async analyzeBucket(bucketName: string): Promise<BucketStats> {
    const stats: BucketStats = {
      name: bucketName,
      totalFiles: 0,
      totalSize: 0,
      folders: new Map()
    }

    // Recursively analyze all files
    await this.analyzeFolder(bucketName, '', stats)

    return stats
  }

  private async analyzeFolder(bucketName: string, folderPath: string, stats: BucketStats): Promise<void> {
    try {
      const { data: items, error } = await serverSupabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.warn(`   ⚠️ Error reading folder ${folderPath}:`, error.message)
        return
      }

      if (!items || items.length === 0) {
        return
      }

      // Process items
      for (const item of items) {
        const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name

        if (item.id) {
          // It's a file
          const fileInfo: FileInfo = {
            name: item.name,
            path: itemPath,
            size: item.metadata?.size || 0,
            lastModified: item.updated_at || item.created_at || 'unknown',
            type: this.getFileType(item.name)
          }

          stats.totalFiles++
          stats.totalSize += fileInfo.size

          // Add to folder stats
          const folderKey = folderPath || 'root'
          if (!stats.folders.has(folderKey)) {
            stats.folders.set(folderKey, {
              fileCount: 0,
              totalSize: 0,
              files: []
            })
          }

          const folderStats = stats.folders.get(folderKey)!
          folderStats.fileCount++
          folderStats.totalSize += fileInfo.size
          folderStats.files.push(fileInfo)

        } else {
          // It's a subdirectory
          await this.analyzeFolder(bucketName, itemPath, stats)
        }
      }

    } catch (error: any) {
      console.warn(`   ⚠️ Exception reading folder ${folderPath}:`, error.message)
    }
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    const typeMap: { [key: string]: string } = {
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
      'mp4': 'video', 'mov': 'video', 'avi': 'video', 'mkv': 'video', 'webm': 'video',
      'pdf': 'document', 'doc': 'document', 'docx': 'document', 'txt': 'document',
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio'
    }
    return typeMap[extension || ''] || 'other'
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  private printResults(): void {
    console.log('='.repeat(70))
    console.log('📊 SUPABASE STORAGE ANALYSIS RESULTS')
    console.log('='.repeat(70))
    
    console.log(`\n🗂️ OVERALL SUMMARY:`)
    console.log(`   Total Files: ${this.totalFiles.toLocaleString()}`)
    console.log(`   Total Size: ${this.formatSize(this.totalSize)}`)
    
    // Storage health assessment
    const sizeGB = this.totalSize / (1024 * 1024 * 1024)
    if (sizeGB > 2) {
      console.log(`   🚨 WARNING: Storage usage is very high (${this.formatSize(this.totalSize)})`)
      console.log(`   💡 Consider aggressive cleanup - your storage might be getting full`)
    } else if (sizeGB > 1) {
      console.log(`   ⚠️ CAUTION: High storage usage (${this.formatSize(this.totalSize)})`)
      console.log(`   💡 Consider cleanup of old or unreferenced files`)
    } else if (sizeGB > 0.5) {
      console.log(`   💡 INFO: Moderate storage usage (${this.formatSize(this.totalSize)})`)
      console.log(`   💡 Monitor and consider periodic cleanup`)
    } else {
      console.log(`   ✅ Storage usage is healthy (${this.formatSize(this.totalSize)})`)
    }

    // Detailed bucket analysis
    console.log(`\n📂 BUCKET BREAKDOWN:`)
    for (const bucket of this.bucketStats) {
      console.log(`\n   ${bucket.name}:`)
      console.log(`     Files: ${bucket.totalFiles.toLocaleString()}`)
      console.log(`     Size: ${this.formatSize(bucket.totalSize)}`)
      console.log(`     Folders: ${bucket.folders.size}`)

      // Show top folders by size
      const sortedFolders = Array.from(bucket.folders.entries())
        .sort(([,a], [,b]) => b.totalSize - a.totalSize)
        .slice(0, 10)

      if (sortedFolders.length > 0) {
        console.log(`     Top folders by size:`)
        sortedFolders.forEach(([folderName, folderStats], index) => {
          const icon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📁'
          console.log(`       ${icon} ${folderName}: ${folderStats.fileCount} files (${this.formatSize(folderStats.totalSize)})`)
        })
      }

      // Show file type breakdown
      const typeStats = new Map<string, { count: number, size: number }>()
      bucket.folders.forEach(folder => {
        folder.files.forEach(file => {
          const current = typeStats.get(file.type) || { count: 0, size: 0 }
          typeStats.set(file.type, {
            count: current.count + 1,
            size: current.size + file.size
          })
        })
      })

      if (typeStats.size > 0) {
        console.log(`     File types:`)
        const sortedTypes = Array.from(typeStats.entries())
          .sort(([,a], [,b]) => b.size - a.size)

        sortedTypes.forEach(([type, stats]) => {
          console.log(`       ${type}: ${stats.count} files (${this.formatSize(stats.size)})`)
        })
      }

      // Show largest files
      const allFiles: FileInfo[] = []
      bucket.folders.forEach(folder => {
        allFiles.push(...folder.files)
      })

      const largestFiles = allFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)

      if (largestFiles.length > 0 && largestFiles[0].size > 0) {
        console.log(`     Largest files:`)
        largestFiles.forEach((file, index) => {
          if (file.size > 0) {
            const icon = index === 0 ? '🔥' : '📄'
            console.log(`       ${icon} ${file.path} (${this.formatSize(file.size)})`)
          }
        })
      }
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`)
    
    const totalSizeMB = this.totalSize / (1024 * 1024)
    
    if (totalSizeMB > 2000) { // 2GB
      console.log(`   🚨 URGENT: Storage over 2GB`)
      console.log(`   📝 Run aggressive cleanup: npm run cleanup:old -- --days=7 --dry-run --verbose`)
      console.log(`   📝 Check for unreferenced files: npm run cleanup:unreferenced -- --dry-run --verbose`)
      console.log(`   📝 Consider upgrading your Supabase plan if needed`)
    } else if (totalSizeMB > 1000) { // 1GB  
      console.log(`   ⚠️ HIGH USAGE: Storage over 1GB`)
      console.log(`   📝 Cleanup recommended: npm run cleanup:old -- --days=30 --dry-run --verbose`)
      console.log(`   📝 Remove unreferenced files: npm run cleanup:unreferenced -- --dry-run --verbose`)
    } else if (totalSizeMB > 500) { // 500MB
      console.log(`   💡 MODERATE USAGE: Consider periodic cleanup`)
      console.log(`   📝 Optional cleanup: npm run cleanup:old -- --days=90 --dry-run --verbose`)
    } else if (totalSizeMB > 100) { // 100MB
      console.log(`   📊 NORMAL USAGE: Storage is healthy`)
      console.log(`   📝 Optional: Review old files occasionally`)
    } else {
      console.log(`   ✅ LOW USAGE: Storage is very healthy`)
      console.log(`   📝 No action needed`)
    }

    console.log('\n' + '='.repeat(70))
  }
}

async function main() {
  const analyzer = new StorageAnalyzer()
  await analyzer.analyzeBuckets()
}

main().catch(error => {
  console.error('💥 Analysis failed:', error)
  process.exit(1)
})
