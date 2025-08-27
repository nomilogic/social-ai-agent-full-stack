/**
 * Request Deduplication Service
 * Prevents duplicate API calls by tracking ongoing requests and implementing debouncing
 */

interface RequestTracker {
  contentHash: string;
  timestamp: number;
  platforms: string[];
  status: 'pending' | 'completed' | 'failed';
  requestId: string;
}

class RequestDeduplicationService {
  private activeRequests: Map<string, RequestTracker> = new Map();
  private completedRequests: Set<string> = new Set();
  private readonly DEBOUNCE_TIME = 1000; // 1 second debounce
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds timeout
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of completed requests to track

  /**
   * Generate a hash for the content data to identify unique requests
   */
  private generateContentHash(contentData: any): string {
    const hashableData = {
      prompt: contentData.prompt,
      platforms: (contentData.selectedPlatforms || contentData.platforms || ['linkedin']).sort(),
      campaignName: contentData.campaignName,
      tone: contentData.tone,
      targetAudience: contentData.targetAudience,
      tags: (contentData.tags || []).sort(),
      mediaUrl: contentData.mediaUrl,
      // Add timestamp for uniqueness but round to nearest second to allow for quick successive calls
      timeGroup: Math.floor(Date.now() / this.DEBOUNCE_TIME)
    };

    return btoa(JSON.stringify(hashableData));
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old requests to prevent memory leaks
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    
    // Remove timed out pending requests
    for (const [hash, tracker] of this.activeRequests.entries()) {
      if (tracker.status === 'pending' && now - tracker.timestamp > this.REQUEST_TIMEOUT) {
        console.warn(`🧹 Cleaning up timed out request: ${hash.substring(0, 16)}...`);
        this.activeRequests.delete(hash);
      }
    }

    // Limit completed requests cache
    if (this.completedRequests.size > this.MAX_CACHE_SIZE) {
      const oldestItems = Array.from(this.completedRequests).slice(0, this.completedRequests.size - this.MAX_CACHE_SIZE);
      oldestItems.forEach(hash => this.completedRequests.delete(hash));
    }
  }

  /**
   * Check if a request should be allowed (not a duplicate)
   */
  canMakeRequest(contentData: any): {
    allowed: boolean;
    reason?: string;
    requestId?: string;
    existingRequestId?: string;
  } {
    this.cleanupOldRequests();

    const contentHash = this.generateContentHash(contentData);
    const platforms = contentData.selectedPlatforms || contentData.platforms || ['linkedin'];

    // Check if we've already completed this exact request recently
    if (this.completedRequests.has(contentHash)) {
      console.log(`🚫 Request blocked - already completed: ${contentHash.substring(0, 16)}...`);
      return {
        allowed: false,
        reason: 'identical_request_completed'
      };
    }

    // Check if there's an active request for the same content
    const activeRequest = this.activeRequests.get(contentHash);
    if (activeRequest && activeRequest.status === 'pending') {
      console.log(`🚫 Request blocked - already in progress: ${contentHash.substring(0, 16)}...`);
      return {
        allowed: false,
        reason: 'request_in_progress',
        existingRequestId: activeRequest.requestId
      };
    }

    // Check for overlapping requests (same content but different platforms)
    for (const [hash, tracker] of this.activeRequests.entries()) {
      if (tracker.status === 'pending') {
        const platformOverlap = platforms.some(p => tracker.platforms.includes(p));
        if (platformOverlap && hash !== contentHash) {
          // Allow if it's been long enough since the last request
          if (Date.now() - tracker.timestamp < this.DEBOUNCE_TIME) {
            console.log(`🚫 Request blocked - platform overlap within debounce time`);
            return {
              allowed: false,
              reason: 'platform_overlap_debounce',
              existingRequestId: tracker.requestId
            };
          }
        }
      }
    }

    // Request is allowed - register it
    const requestId = this.generateRequestId();
    this.activeRequests.set(contentHash, {
      contentHash,
      timestamp: Date.now(),
      platforms,
      status: 'pending',
      requestId
    });

    console.log(`✅ Request allowed: ${contentHash.substring(0, 16)}... (ID: ${requestId})`);
    return {
      allowed: true,
      requestId
    };
  }

  /**
   * Mark a request as completed successfully
   */
  markRequestCompleted(contentData: any, requestId: string): void {
    const contentHash = this.generateContentHash(contentData);
    const activeRequest = this.activeRequests.get(contentHash);

    if (activeRequest && activeRequest.requestId === requestId) {
      activeRequest.status = 'completed';
      this.completedRequests.add(contentHash);
      console.log(`✅ Request completed: ${contentHash.substring(0, 16)}... (ID: ${requestId})`);
      
      // Remove from active requests after a short delay
      setTimeout(() => {
        this.activeRequests.delete(contentHash);
      }, 2000);
    } else {
      console.warn(`⚠️ Attempted to mark unknown request as completed: ${requestId}`);
    }
  }

  /**
   * Mark a request as failed
   */
  markRequestFailed(contentData: any, requestId: string, error?: string): void {
    const contentHash = this.generateContentHash(contentData);
    const activeRequest = this.activeRequests.get(contentHash);

    if (activeRequest && activeRequest.requestId === requestId) {
      activeRequest.status = 'failed';
      console.log(`❌ Request failed: ${contentHash.substring(0, 16)}... (ID: ${requestId}) - ${error || 'Unknown error'}`);
      
      // Remove failed requests immediately so they can be retried
      this.activeRequests.delete(contentHash);
    } else {
      console.warn(`⚠️ Attempted to mark unknown request as failed: ${requestId}`);
    }
  }

  /**
   * Force clear all requests (useful for debugging or reset)
   */
  clearAllRequests(): void {
    console.log('🧹 Clearing all request tracking data');
    this.activeRequests.clear();
    this.completedRequests.clear();
  }

  /**
   * Get current status for debugging
   */
  getStatus(): {
    activeRequests: number;
    completedRequests: number;
    details: Array<{
      hash: string;
      platforms: string[];
      status: string;
      age: number;
    }>;
  } {
    const now = Date.now();
    return {
      activeRequests: this.activeRequests.size,
      completedRequests: this.completedRequests.size,
      details: Array.from(this.activeRequests.entries()).map(([hash, tracker]) => ({
        hash: hash.substring(0, 16) + '...',
        platforms: tracker.platforms,
        status: tracker.status,
        age: now - tracker.timestamp
      }))
    };
  }
}

// Export singleton instance
export const requestDeduplicationService = new RequestDeduplicationService();

// For debugging in development
if (typeof window !== 'undefined') {
  (window as any).debugRequestDeduplication = {
    getStatus: () => requestDeduplicationService.getStatus(),
    clearAll: () => requestDeduplicationService.clearAllRequests()
  };
}
