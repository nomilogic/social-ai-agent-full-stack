#!/usr/bin/env tsx
/**
 * Storage Usage Checker for Supabase
 * 
 * This script analyzes your Supabase storage usage and provides a summary
 * of files, sizes, and organization.
 */

import { serverSupabase } from '../supabaseClient.js'
import { db } from '../db.js'
import { media } from '../../shared/schema.js'
import { sql } from 'drizzle-orm'

interface StorageStats {
  totalFiles: number
  totalSize: number
  buckets: { [bucket: string]: BucketStats }
  dbRecords: number
  referencedFiles: number
  unreferencedFiles: number
}

interface BucketStats {
  fileCount: number
  totalSize: number
  folders: { [folder: string]: FolderStats }
  fileTypes: { [extension: string]: number }
}

interface FolderStats {
  fileCount: number
  totalSize: number
}

class StorageUsageChecker {
  private stats: StorageStats = {
    totalFiles: 0,
    totalSize: 0,
    buckets: {},
    dbRecords: 0,
    referencedFiles: 0,
    unreferencedFiles: 0
  }

  async run(): Promise<void> {
    console.log('📊 Checking Supabase storage usage...\n')

    try {
      // List all buckets
      console.log('🔍 Attempting to list buckets...')
      const buckets = await this.listBuckets()
      console.log(`🗂️ Found ${buckets.length} storage buckets`)

      // Analyze each bucket
      for (const bucket of buckets) {
        console.log(`\n📂 Analyzing bucket: ${bucket.name}`)
        await this.analyzeBucket(bucket.name)
      }

      // Get database records
      await this.getDatabaseStats()

      // Print summary
      this.printSummary()

    } catch (error) {
      console.error('❌ Error checking storage usage:', error)
      process.exit(1)
    }
  }

  private async listBuckets(): Promise<any[]> {
    try {
      const { data, error } = await serverSupabase.storage.listBuckets()
      
      if (error) {
        throw new Error(`Failed to list buckets: ${error.message}`)
      }

      return data || []
    } catch (error: any) {
      console.warn('⚠️ Could not list buckets, trying default "images" bucket')
      return [{ name: 'images', id: 'images' }]
    }
  }

  private async analyzeBucket(bucketName: string): Promise<void> {
    this.stats.buckets[bucketName] = {
      fileCount: 0,
      totalSize: 0,
      folders: {},
      fileTypes: {}
    }

    const files = await this.getFilesFromBucket(bucketName)
    console.log(`   📄 Found ${files.length} files`)

    for (const file of files) {
      this.stats.totalFiles++
      this.stats.buckets[bucketName].fileCount++

      const fileSize = file.metadata?.size || 0
      this.stats.totalSize += fileSize
      this.stats.buckets[bucketName].totalSize += fileSize

      // Analyze folder structure
      const folder = this.extractFolder(file.path || file.name)
      if (!this.stats.buckets[bucketName].folders[folder]) {
        this.stats.buckets[bucketName].folders[folder] = {
          fileCount: 0,
          totalSize: 0
        }
      }
      this.stats.buckets[bucketName].folders[folder].fileCount++
      this.stats.buckets[bucketName].folders[folder].totalSize += fileSize

      // Analyze file types
      const extension = this.getFileExtension(file.name)
      this.stats.buckets[bucketName].fileTypes[extension] = 
        (this.stats.buckets[bucketName].fileTypes[extension] || 0) + 1
    }

    console.log(`   💾 Total size: ${this.formatFileSize(this.stats.buckets[bucketName].totalSize)}`)
  }

  private async getFilesFromBucket(bucketName: string): Promise<any[]> {
    try {
      const allFiles: any[] = []
      await this.getFilesRecursively(bucketName, '', allFiles)
      return allFiles
    } catch (error: any) {
      console.warn(`⚠️ Could not analyze bucket ${bucketName}:`, error.message)
      return []
    }
  }

  private async getFilesRecursively(bucketName: string, folderPath: string, allFiles: any[]): Promise<void> {
    try {
      const { data, error } = await serverSupabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.warn(`Warning: Could not list files in ${bucketName}/${folderPath}:`, error.message)
        return
      }

      if (data) {
        for (const item of data) {
          if (item.id) { // It's a file
            allFiles.push({
              ...item,
              path: folderPath ? `${folderPath}/${item.name}` : item.name
            })
          } else { // It's a directory
            const subPath = folderPath ? `${folderPath}/${item.name}` : item.name
            await this.getFilesRecursively(bucketName, subPath, allFiles)
          }
        }
      }
    } catch (error: any) {
      console.warn(`Error listing ${bucketName}/${folderPath}:`, error.message)
    }
  }

  private async getDatabaseStats(): Promise<void> {
    try {
      console.log('\n💾 Checking database media records...')
      
      const records = await db
        .select()
        .from(media)
      
      this.stats.dbRecords = records.length
      console.log(`   📊 Found ${records.length} media records in database`)

      // Count referenced vs unreferenced files
      const dbFilePaths = new Set(
        records
          .filter(record => record.file_path?.includes('supabase.co'))
          .map(record => this.extractPathFromUrl(record.file_path!))
          .filter(path => path !== null)
      )

      // Count how many storage files are referenced
      for (const bucketName in this.stats.buckets) {
        // This is a simplified check - in a real scenario we'd need to map storage paths to URLs
        this.stats.referencedFiles += dbFilePaths.size
      }

      this.stats.unreferencedFiles = this.stats.totalFiles - this.stats.referencedFiles

    } catch (error: any) {
      console.warn('⚠️ Could not check database records:', error.message)
    }
  }

  private extractFolder(filePath: string): string {
    const parts = filePath.split('/')
    return parts.length > 1 ? parts.slice(0, -1).join('/') : 'root'
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'no-extension'
  }

  private extractPathFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 STORAGE USAGE SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`🗂️ Total files: ${this.stats.totalFiles.toLocaleString()}`)
    console.log(`💾 Total size: ${this.formatFileSize(this.stats.totalSize)}`)
    console.log(`📋 Database records: ${this.stats.dbRecords.toLocaleString()}`)

    if (this.stats.totalSize > 500 * 1024 * 1024) { // 500MB
      console.log(`\n⚠️ WARNING: Storage usage is high (${this.formatFileSize(this.stats.totalSize)})`)
      console.log('   Consider running cleanup operations.')
    } else if (this.stats.totalSize > 100 * 1024 * 1024) { // 100MB
      console.log(`\n💡 INFO: Moderate storage usage (${this.formatFileSize(this.stats.totalSize)})`)
    } else {
      console.log(`\n✅ Storage usage looks healthy (${this.formatFileSize(this.stats.totalSize)})`)
    }

    // Bucket breakdown
    console.log(`\n📂 BUCKET BREAKDOWN:`)
    for (const [bucketName, bucketStats] of Object.entries(this.stats.buckets)) {
      console.log(`  ${bucketName}:`)
      console.log(`    Files: ${bucketStats.fileCount.toLocaleString()}`)
      console.log(`    Size: ${this.formatFileSize(bucketStats.totalSize)}`)
      
      // Top folders
      const topFolders = Object.entries(bucketStats.folders)
        .sort(([,a], [,b]) => b.totalSize - a.totalSize)
        .slice(0, 5)
      
      if (topFolders.length > 0) {
        console.log(`    Top folders:`)
        topFolders.forEach(([folder, stats]) => {
          console.log(`      ${folder}: ${stats.fileCount} files (${this.formatFileSize(stats.totalSize)})`)
        })
      }

      // File types
      const topTypes = Object.entries(bucketStats.fileTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      if (topTypes.length > 0) {
        console.log(`    File types:`)
        topTypes.forEach(([type, count]) => {
          console.log(`      .${type}: ${count} files`)
        })
      }
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`)
    
    if (this.stats.totalSize > 1024 * 1024 * 1024) { // 1GB
      console.log(`   🚨 Storage is over 1GB - consider aggressive cleanup`)
      console.log(`   📝 Run: npm run cleanup:unreferenced -- --dry-run --verbose`)
      console.log(`   📝 Run: npm run cleanup:old -- --days=30 --dry-run --verbose`)
    } else if (this.stats.totalSize > 500 * 1024 * 1024) { // 500MB
      console.log(`   ⚠️ Storage is getting full - cleanup recommended`)
      console.log(`   📝 Run: npm run cleanup:unreferenced -- --dry-run --verbose`)
    } else if (this.stats.totalSize > 100 * 1024 * 1024) { // 100MB
      console.log(`   💡 Consider periodic cleanup of old files`)
      console.log(`   📝 Run: npm run cleanup:dry-run --verbose`)
    } else {
      console.log(`   ✅ Storage usage is healthy - no immediate action needed`)
    }

    console.log('='.repeat(60))
  }
}

// Main execution
async function main() {
  const checker = new StorageUsageChecker()
  await checker.run()
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error)
}

export { StorageUsageChecker }
