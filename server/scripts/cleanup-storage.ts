#!/usr/bin/env tsx
/**
 * Storage Cleanup Utility for Supabase
 * 
 * This script removes old and unreferenced images/videos from Supabase storage
 * and cleans up corresponding database records.
 * 
 * Usage:
 * npm run cleanup:storage -- --dry-run          # Preview what would be deleted
 * npm run cleanup:storage -- --days=30          # Delete files older than 30 days
 * npm run cleanup:storage -- --unreferenced     # Delete unreferenced files
 * npm run cleanup:storage -- --execute          # Actually delete files (use with caution)
 */

import { serverSupabase } from '../supabaseClient.js'
import { db } from '../db.js'
import { media } from '../../shared/schema.js'
import { supabaseStorage } from '../lib/supabaseStorage.js'
import { eq, lt, sql, and, or } from 'drizzle-orm'
import path from 'path'

interface CleanupOptions {
  dryRun: boolean
  execute: boolean
  days: number
  unreferenced: boolean
  bucket: string
  verbose: boolean
}

interface CleanupStats {
  storageFilesScanned: number
  dbRecordsScanned: number
  storageFilesDeleted: number
  dbRecordsDeleted: number
  totalSpaceFreed: number
  errors: string[]
}

class StorageCleanup {
  private options: CleanupOptions
  private stats: CleanupStats

  constructor(options: CleanupOptions) {
    this.options = options
    this.stats = {
      storageFilesScanned: 0,
      dbRecordsScanned: 0,
      storageFilesDeleted: 0,
      dbRecordsDeleted: 0,
      totalSpaceFreed: 0,
      errors: []
    }
  }

  async run(): Promise<void> {
    console.log('🧹 Starting storage cleanup...')
    console.log(`📊 Options:`, this.options)
    
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be deleted')
    }

    try {
      // Get all files from Supabase storage
      console.log(`📂 Scanning bucket: ${this.options.bucket}`)
      const storageFiles = await this.getStorageFiles()
      this.stats.storageFilesScanned = storageFiles.length
      console.log(`📊 Found ${storageFiles.length} files in storage`)

      // Get all media records from database
      console.log('💾 Scanning database records...')
      const dbRecords = await this.getDatabaseRecords()
      this.stats.dbRecordsScanned = dbRecords.length
      console.log(`📊 Found ${dbRecords.length} records in database`)

      // Find files to delete based on criteria
      const filesToDelete = await this.findFilesToDelete(storageFiles, dbRecords)
      
      if (filesToDelete.length === 0) {
        console.log('✨ No files found for cleanup!')
        return
      }

      console.log(`🗑️ Found ${filesToDelete.length} files to delete`)
      
      if (this.options.verbose) {
        filesToDelete.forEach(file => {
          console.log(`  - ${file.name} (${this.formatFileSize(file.metadata?.size || 0)}) - ${file.reason}`)
        })
      }

      // Calculate potential space savings
      const totalSize = filesToDelete.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
      console.log(`💾 Total space to be freed: ${this.formatFileSize(totalSize)}`)

      if (this.options.dryRun) {
        console.log('🔍 DRY RUN - Would delete the above files')
        this.printSummary()
        return
      }

      // Confirm deletion if not in execute mode
      if (!this.options.execute) {
        console.log('⚠️ Use --execute flag to actually delete files')
        this.printSummary()
        return
      }

      // Actually delete files
      await this.deleteFiles(filesToDelete)
      
      this.printSummary()
      console.log('✅ Storage cleanup completed!')

    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      process.exit(1)
    }
  }

  private async getStorageFiles(): Promise<any[]> {
    try {
      const { data, error } = await serverSupabase.storage
        .from(this.options.bucket)
        .list('', { 
          limit: 1000,
          offset: 0,
          sortBy: { column: 'updated_at', order: 'asc' }
        })

      if (error) {
        throw new Error(`Failed to list storage files: ${error.message}`)
      }

      // Recursively get files from subdirectories
      const allFiles: any[] = []
      
      if (data) {
        for (const item of data) {
          if (item.id) { // It's a file
            allFiles.push({
              ...item,
              path: item.name
            })
          } else { // It's a directory, recurse into it
            const subFiles = await this.getFilesFromFolder(item.name)
            allFiles.push(...subFiles)
          }
        }
      }

      return allFiles
    } catch (error: any) {
      this.stats.errors.push(`Error listing storage files: ${error.message}`)
      return []
    }
  }

  private async getFilesFromFolder(folderPath: string): Promise<any[]> {
    try {
      const { data, error } = await serverSupabase.storage
        .from(this.options.bucket)
        .list(folderPath, { 
          limit: 1000,
          sortBy: { column: 'updated_at', order: 'asc' }
        })

      if (error) {
        console.warn(`Warning: Could not list files in folder ${folderPath}:`, error.message)
        return []
      }

      const files: any[] = []
      
      if (data) {
        for (const item of data) {
          if (item.id) { // It's a file
            files.push({
              ...item,
              path: `${folderPath}/${item.name}`
            })
          } else { // It's a subdirectory
            const subFiles = await this.getFilesFromFolder(`${folderPath}/${item.name}`)
            files.push(...subFiles)
          }
        }
      }

      return files
    } catch (error: any) {
      this.stats.errors.push(`Error listing folder ${folderPath}: ${error.message}`)
      return []
    }
  }

  private async getDatabaseRecords(): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(media)
        .where(sql`${media.file_path} LIKE '%supabase.co%'`)
      
      return records
    } catch (error: any) {
      this.stats.errors.push(`Error fetching database records: ${error.message}`)
      return []
    }
  }

  private async findFilesToDelete(storageFiles: any[], dbRecords: any[]): Promise<Array<{name: string, path: string, reason: string, metadata?: any}>> {
    const filesToDelete: Array<{name: string, path: string, reason: string, metadata?: any}> = []
    
    // Create a map of database file paths for quick lookup
    const dbFilePaths = new Set(
      dbRecords
        .map(record => this.extractPathFromUrl(record.file_path))
        .filter(path => path !== null)
    )

    for (const file of storageFiles) {
      let shouldDelete = false
      let reason = ''

      // Check if file is older than specified days
      if (this.options.days > 0) {
        const fileAge = new Date(file.updated_at || file.created_at)
        const cutoffDate = new Date(Date.now() - (this.options.days * 24 * 60 * 60 * 1000))
        
        if (fileAge < cutoffDate) {
          shouldDelete = true
          reason = `older than ${this.options.days} days`
        }
      }

      // Check if file is unreferenced in database
      if (this.options.unreferenced) {
        if (!dbFilePaths.has(file.path)) {
          shouldDelete = true
          reason = reason ? `${reason} and unreferenced` : 'unreferenced in database'
        }
      }

      if (shouldDelete) {
        filesToDelete.push({
          name: file.name,
          path: file.path,
          reason: reason,
          metadata: file.metadata || { size: 0 }
        })
      }
    }

    return filesToDelete
  }

  private extractPathFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  private async deleteFiles(filesToDelete: Array<{name: string, path: string, reason: string, metadata?: any}>): Promise<void> {
    console.log('🗑️ Starting file deletion...')
    
    for (const file of filesToDelete) {
      try {
        // Delete from Supabase storage
        const { error: storageError } = await serverSupabase.storage
          .from(this.options.bucket)
          .remove([file.path])

        if (storageError) {
          this.stats.errors.push(`Failed to delete storage file ${file.path}: ${storageError.message}`)
          continue
        }

        // Delete corresponding database records
        const urlPattern = `%${file.path}%`
        const { rowCount } = await db
          .delete(media)
          .where(sql`${media.file_path} LIKE ${urlPattern}`)

        this.stats.storageFilesDeleted++
        this.stats.dbRecordsDeleted += rowCount || 0
        this.stats.totalSpaceFreed += file.metadata?.size || 0

        if (this.options.verbose) {
          console.log(`✅ Deleted: ${file.path} (${rowCount || 0} DB records)`)
        }

      } catch (error: any) {
        this.stats.errors.push(`Error deleting file ${file.path}: ${error.message}`)
      }
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private printSummary(): void {
    console.log('\n📊 CLEANUP SUMMARY')
    console.log('==================')
    console.log(`📂 Storage files scanned: ${this.stats.storageFilesScanned}`)
    console.log(`💾 Database records scanned: ${this.stats.dbRecordsScanned}`)
    console.log(`🗑️ Storage files deleted: ${this.stats.storageFilesDeleted}`)
    console.log(`💾 Database records deleted: ${this.stats.dbRecordsDeleted}`)
    console.log(`💾 Total space freed: ${this.formatFileSize(this.stats.totalSpaceFreed)}`)
    
    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors encountered: ${this.stats.errors.length}`)
      if (this.options.verbose) {
        this.stats.errors.forEach(error => console.log(`  - ${error}`))
      }
    }
    console.log('==================\n')
  }
}

// Parse command line arguments
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2)
  const options: CleanupOptions = {
    dryRun: true, // Default to dry run for safety
    execute: false,
    days: 0,
    unreferenced: false,
    bucket: 'images',
    verbose: false
  }

  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true
      options.execute = false
    } else if (arg === '--execute') {
      options.dryRun = false
      options.execute = true
    } else if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]) || 0
    } else if (arg === '--unreferenced') {
      options.unreferenced = true
    } else if (arg.startsWith('--bucket=')) {
      options.bucket = arg.split('=')[1] || 'images'
    } else if (arg === '--verbose') {
      options.verbose = true
    }
  })

  // If no specific criteria are provided, default to unreferenced files
  if (options.days === 0 && !options.unreferenced) {
    options.unreferenced = true
    console.log('ℹ️ No cleanup criteria specified, defaulting to --unreferenced')
  }

  return options
}

// Main execution
async function main() {
  const options = parseArgs()
  const cleanup = new StorageCleanup(options)
  await cleanup.run()
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { StorageCleanup, CleanupOptions }
