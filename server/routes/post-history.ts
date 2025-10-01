import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzdpldiqbcssaqczizjw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Now using database is_read columns!

/**
 * Get post history for a user
 * Returns published posts with their platform URLs and metadata
 */
router.get('/history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log('Fetching post history for user:', userId);

    let allPosts: any[] = [];
    
    // First, try to get posts from scheduled_posts table (published posts)
    try {
      let scheduledQuery = supabase
        .from('scheduled_posts')
        .select(`
          id,
          content,
          platforms,
          published_urls,
          created_at,
          updated_at,
          image_url,
          category,
          campaign_id,
          is_read
        `)
        .eq('status', 'published')
        .order('updated_at', { ascending: false });


      const { data: scheduledPosts, error: scheduledError } = await scheduledQuery;
      
      if (scheduledError) {
        console.warn('Error fetching from scheduled_posts:', scheduledError);
      } else {
        allPosts = allPosts.concat(scheduledPosts || []);
      }
    } catch (scheduledErr) {
      console.warn('Failed to fetch scheduled posts:', scheduledErr);
    }

    // Also try to get posts from the posts table 
    try {
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          prompt,
          generated_content,
          created_at,
          updated_at,
          media_url,
          tags,
          user_id,
          campaign_id,
          is_read
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      const { data: regularPosts, error: postsError } = await postsQuery;
      
      if (postsError) {
        console.warn('Error fetching from posts table:', postsError);
      } else if (regularPosts) {
        // Transform posts table format to match scheduled_posts format
        const transformedPosts = regularPosts.map(post => {
          // Extract platform information from generated_content if available
          let platforms = ['linkedin']; // Fallback default
          let published_urls = {};
          
          if (post.generated_content && typeof post.generated_content === 'object') {
            // If it's already parsed as an object
            if (post.generated_content.platforms && Array.isArray(post.generated_content.platforms)) {
              platforms = post.generated_content.platforms;
            }
            if (post.generated_content.publishedUrls && typeof post.generated_content.publishedUrls === 'object') {
              published_urls = post.generated_content.publishedUrls;
            }
          } else if (post.generated_content && typeof post.generated_content === 'string') {
            // If it's a JSON string, try to parse it
            try {
              const parsedContent = JSON.parse(post.generated_content);
              if (parsedContent.platforms && Array.isArray(parsedContent.platforms)) {
                platforms = parsedContent.platforms;
              }
              if (parsedContent.publishedUrls && typeof parsedContent.publishedUrls === 'object') {
                published_urls = parsedContent.publishedUrls;
              }
            } catch (parseError) {
              console.warn('Failed to parse generated_content JSON:', parseError);
            }
          }
          
          // Extract platform from tags if available as backup
          if (platforms.length === 1 && platforms[0] === 'linkedin' && post.tags && Array.isArray(post.tags)) {
            const validPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];
            const foundPlatforms = post.tags.filter(tag => validPlatforms.includes(tag.toLowerCase()));
            if (foundPlatforms.length > 0) {
              platforms = foundPlatforms.map(p => p.toLowerCase());
            }
          }
          
          return {
            ...post,
            content: post.prompt || (post.generated_content ? (typeof post.generated_content === 'string' ? post.generated_content : JSON.stringify(post.generated_content)) : ''),
            image_url: post.media_url,
            platforms,
            published_urls,
            category: 'General'
          };
        });
        allPosts = allPosts.concat(transformedPosts);
      }
    } catch (postsErr) {
      console.warn('Failed to fetch regular posts:', postsErr);
    }

    // Sort all posts by date (newest first)
    allPosts.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    
    // Apply pagination
    const startIndex = parseInt(offset as string) || 0;
    const limitNum = parseInt(limit as string) || 50;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + limitNum);

    // Transform posts to include individual platform entries (using database is_read)
    const transformedPosts: any[] = [];

    // Process each published post
    for (const post of paginatedPosts || []) {
      const publishedUrls = post.published_urls || {};
      const platforms = post.platforms || [];
      
      // Create entries for each platform where the post was published
      for (const platform of platforms) {
        const platformKey = platform.toLowerCase();
        const postUrl = publishedUrls[platformKey] || publishedUrls[platform];
        
        // Always show the post, even if no URL (for posts table entries)
        const platformPostId = postUrl ? extractPlatformPostId(postUrl, platform) : null;
        
        // Use database is_read column
        const isRead = Boolean(post.is_read);
        
        // Fetch real metadata from platform (with fallback)
        const metadata = await fetchPlatformMetadata(platform, platformPostId, postUrl || '', post);
        
        transformedPosts.push({
          id: `${post.id}-${platform}`,
          platform: platform.toLowerCase(),
          postId: platformPostId || post.id.slice(-8),
          postUrl: postUrl || generatePlatformUrl(platform, post.id, post.content),
          content: post.content,
          publishedAt: post.updated_at || post.created_at,
          isRead: isRead,
          metadata: {
            ...metadata,
            campaignName: 'Social Media Post',
            category: post.category || 'General',
            hasRealUrl: !!postUrl // Flag to indicate if this is a real or generated URL
          }
        });
      }
    }

    console.log('Successfully fetched', transformedPosts.length, 'posts for user:', userId);
    
    res.json({
      posts: transformedPosts,
      total: transformedPosts.length,
      hasMore: transformedPosts.length === parseInt(limit as string)
    });

  } catch (error) {
    console.error('Error in post history endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get unread posts count
 */
router.get('/history/unread-count', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    let unreadCount = 0;

    // Count scheduled posts where is_read = false
    try {
      const { data: scheduledPosts, error: scheduledError } = await supabase
        .from('scheduled_posts')
        .select('id, platforms')
        .eq('status', 'published')
        .eq('is_read', false)
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (!scheduledError && scheduledPosts) {
        for (const post of scheduledPosts) {
          const platforms = post.platforms || ['linkedin'];
          unreadCount += platforms.length;
        }
      }
    } catch (err) {
      console.warn('Error fetching scheduled posts for unread count:', err);
    }
    
    // Count posts from posts table where is_read = false
    try {
      const { data: regularPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, tags, generated_content')
        .eq('user_id', userId)
        .eq('is_read', false)
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (!postsError && regularPosts) {
        for (const post of regularPosts) {
          // Extract platforms from tags or generated_content
          let platforms = ['linkedin']; // default
          
          if (post.generated_content && typeof post.generated_content === 'object' && (post as any).generated_content.platforms) {
            platforms = (post as any).generated_content.platforms;
          } else if ((post as any).tags && Array.isArray((post as any).tags)) {
            const validPlatforms = ['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];
            const foundPlatforms = (post as any).tags.filter((tag: string) => validPlatforms.includes(tag.toLowerCase()));
            if (foundPlatforms.length > 0) {
              platforms = foundPlatforms;
            }
          }
          
          unreadCount += platforms.length;
        }
      }
    } catch (err) {
      console.warn('Error fetching regular posts for unread count:', err);
    }
    
    console.log(`📊 Calculated ${unreadCount} unread posts for user ${userId}`);
    res.json({ unreadCount });

  } catch (error) {
    console.error('Error in unread count endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Mark a post as read
 */
router.post('/history/:postId/read', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { postId } = req.params; // Format: "basePostId-platform"
    const userId = req.user.id;

    // Extract base post ID and platform from the composite ID
    const parts = postId.split('-');
    if (parts.length < 2) {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }
    
    const platform = parts[parts.length - 1];
    const basePostId = parts.slice(0, -1).join('-');

    // Update is_read column in database
    let updateSuccess = false;
    
    // Try updating scheduled_posts table
    const { error: scheduledError } = await supabase
      .from('scheduled_posts')
      .update({ is_read: true })
      .eq('id', basePostId);
      
    if (!scheduledError) {
      updateSuccess = true;
      console.log(`Marked scheduled post ${basePostId} as read for user ${userId}`);
    }
    
    // Try updating posts table
    const { error: postsError } = await supabase
      .from('posts')
      .update({ is_read: true })
      .eq('id', basePostId)
      .eq('user_id', userId);
      
    if (!postsError) {
      updateSuccess = true;
      console.log(`Marked regular post ${basePostId} as read for user ${userId}`);
    }
    
    if (!updateSuccess) {
      console.warn('Failed to update post in both tables:', { scheduledError, postsError });
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ success: true, message: 'Post marked as read' });

  } catch (error) {
    console.error('Error marking post as read:', error);
    res.status(500).json({ error: 'Failed to mark post as read' });
  }
});

/**
 * Mark all posts as read
 */
router.post('/history/read-all', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    let markedCount = 0;

    // Mark all unread scheduled posts as read in database
    try {
      const { error: scheduledError } = await supabase
        .from('scheduled_posts')
        .update({ 
          is_read: true
        })
        .eq('status', 'published')
        .eq('is_read', false)
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (!scheduledError) {
        console.log('Marked scheduled posts as read for user:', userId);
      }
    } catch (err) {
      console.warn('Error updating scheduled posts for mark all as read:', err);
    }
    
    // Mark all unread posts from posts table as read in database
    try {
      const { error: postsError } = await supabase
        .from('posts')
        .update({ 
          is_read: true
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (!postsError) {
        console.log('Marked regular posts as read for user:', userId);
      }
    } catch (err) {
      console.warn('Error updating regular posts for mark all as read:', err);
    }
    
    console.log(`Marked all posts as read for user ${userId}`);
    res.json({ success: true, message: 'All posts marked as read' });

  } catch (error) {
    console.error('Error marking all posts as read:', error);
    res.status(500).json({ error: 'Failed to mark all posts as read' });
  }
});

/**
 * Get post engagement stats (if available from platform APIs)
 */
router.get('/history/:postId/stats', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    // This would integrate with platform APIs to get real engagement data
    // For now, return mock data
    res.json({
      likes: Math.floor(Math.random() * 200) + 10,
      comments: Math.floor(Math.random() * 50) + 2,
      shares: Math.floor(Math.random() * 30) + 1,
      views: Math.floor(Math.random() * 1000) + 100
    });

  } catch (error) {
    console.error('Error fetching post stats:', error);
    res.status(500).json({ error: 'Failed to fetch post stats' });
  }
});

/**
 * Save published post URLs - Called when a post is successfully published
 * POST /api/post-history/save-published-urls
 */
router.post('/save-published-urls', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { 
      postId, 
      postContent, 
      publishedUrls, // { linkedin: 'https://...', facebook: 'https://...' }
      platforms,
      category,
      imageUrl
    } = req.body;

    if (!postId || !publishedUrls || !platforms) {
      return res.status(400).json({ 
        error: 'Missing required fields: postId, publishedUrls, and platforms' 
      });
    }

    const userId = req.user.id;
    
    // First, save to posts table for our app history
    try {
      // Find a campaign for this user (required by posts.campaign_id)
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (campaignError || !campaign) {
        console.warn('No campaign found for user; creating a default campaign. Error:', campaignError);
        
        // Create a default campaign if none exists
        const { data: newCampaign, error: createCampaignError } = await supabase
          .from('campaigns')
          .insert({
            user_id: userId,
            name: 'Default Campaign',
            description: 'Default campaign for published posts',
            brand_tone: 'professional',
            goals: ['engagement'],
            platforms: platforms || ['linkedin']
          })
          .select('id')
          .single();
        
        if (createCampaignError || !newCampaign) {
          console.warn('Failed to create default campaign; skipping saving to posts table. Error:', createCampaignError);
        } else {
          const { data: savedPost, error: postError } = await supabase
            .from('posts')
            .insert({
              user_id: userId,
              campaign_id: newCampaign.id,
              prompt: postContent || '',
              generated_content: {
                publishedUrls,
                platforms,
                category: category || 'General'
              },
              media_url: imageUrl,
              tags: platforms
            })
            .select()
            .single();

          if (postError) {
            console.warn('Failed to save to posts table:', postError);
          } else {
            console.log('Saved post to posts table with new campaign:', savedPost.id);
          }
        }
      } else {
        const { data: savedPost, error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            campaign_id: campaign.id,
            prompt: postContent || '',
            generated_content: {
              publishedUrls,
              platforms,
              category: category || 'General'
            },
            media_url: imageUrl,
            tags: platforms
          })
          .select()
          .single();

        if (postError) {
          console.warn('Failed to save to posts table:', postError);
        } else {
          console.log('Saved post to posts table:', savedPost.id);
        }
      }
    } catch (postsErr) {
      console.warn('Error saving to posts table:', postsErr);
    }

    // Also try to save/update in scheduled_posts table if it exists
    try {
      const { data: existingPost } = await supabase
        .from('scheduled_posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (existingPost) {
        // Update existing scheduled post with published URLs
        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({
            published_urls: publishedUrls,
            status: 'published',
            updated_at: new Date().toISOString()
          })
          .eq('id', postId);

        if (updateError) {
          console.warn('Failed to update scheduled_posts:', updateError);
        } else {
          console.log('Updated scheduled post with published URLs');
        }
      } else {
        // Create new entry in scheduled_posts
        const { error: insertError } = await supabase
          .from('scheduled_posts')
          .insert({
            id: postId,
            content: postContent || '',
            platforms,
            published_urls: publishedUrls,
            status: 'published',
            category: category || 'General',
            image_url: imageUrl,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString().split('T')[1].split('.')[0]
          });

        if (insertError) {
          console.warn('Failed to insert to scheduled_posts:', insertError);
        } else {
          console.log('Created new scheduled post entry');
        }
      }
    } catch (scheduledErr) {
      console.warn('Error with scheduled_posts:', scheduledErr);
    }

    res.json({ 
      success: true, 
      message: 'Published post URLs saved successfully',
      postId
    });

  } catch (error) {
    console.error('Error saving published post URLs:', error);
    res.status(500).json({ 
      error: 'Failed to save published post URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update published post URLs for existing posts
 * PUT /api/post-history/update-urls/:postId
 */
router.put('/update-urls/:postId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { postId } = req.params;
    const { publishedUrls, platforms } = req.body;
    const userId = req.user.id;

    if (!publishedUrls) {
      return res.status(400).json({ error: 'publishedUrls is required' });
    }

    // Update scheduled_posts table if the record exists
    const { error: scheduledError } = await supabase
      .from('scheduled_posts')
      .update({
        published_urls: publishedUrls,
        platforms: platforms || undefined,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (scheduledError) {
      console.warn('Failed to update scheduled_posts:', scheduledError);
    }

    // Also update posts table if it exists
    const { error: postsError } = await supabase
      .from('posts')
      .update({
        generated_content: {
          publishedUrls,
          platforms: platforms || ['linkedin'],
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId);

    if (postsError) {
      console.warn('Failed to update posts table:', postsError);
    }

    res.json({ 
      success: true, 
      message: 'Post URLs updated successfully' 
    });

  } catch (error) {
    console.error('Error updating post URLs:', error);
    res.status(500).json({ 
      error: 'Failed to update post URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions

/**
 * Generate a realistic platform URL based on platform and post data
 */
function generatePlatformUrl(platform: string, postId: string, content: string): string {
  const shortId = postId.slice(-8);
  
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return `https://www.linkedin.com/feed/update/urn:li:share:${shortId}`;
    case 'facebook':
      return `https://www.facebook.com/${shortId}`;
    case 'instagram':
      return `https://www.instagram.com/p/${shortId}/`;
    case 'twitter':
    case 'x':
      return `https://twitter.com/user/status/${shortId}`;
    case 'youtube':
      return `https://www.youtube.com/watch?v=${shortId}`;
    case 'tiktok':
      return `https://www.tiktok.com/@user/video/${shortId}`;
    default:
      return `https://${platform}.com/posts/${shortId}`;
  }
}

/**
 * Extract platform-specific post ID from URL
 */
function extractPlatformPostId(url: string, platform: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    switch (platform.toLowerCase()) {
      case 'linkedin':
        // LinkedIn URLs: https://www.linkedin.com/feed/update/urn:li:share:postId
        const linkedinFeedMatch = url.match(/\/feed\/update\/(urn:li:share:[^/?]+)/);
        if (linkedinFeedMatch) return linkedinFeedMatch[1];
        // Legacy format: https://www.linkedin.com/posts/username_activity-123456789
        const linkedinActivityMatch = url.match(/activity-(\d+)/);
        if (linkedinActivityMatch) return linkedinActivityMatch[1];
        // Direct share URLs: urn:li:share:postId
        const linkedinShareMatch = url.match(/(urn:li:share:[^/?]+)/);
        return linkedinShareMatch ? linkedinShareMatch[1] : null;
        
      case 'facebook':
        // Facebook URLs: https://www.facebook.com/:fbpostId
        const fbMatch = url.match(/facebook\.com\/([^/?]+)/);
        if (fbMatch) return fbMatch[1];
        // Legacy format: https://www.facebook.com/userid/posts/123456789
        const fbLegacyMatch = url.match(/\/posts\/(\d+)/);
        if (fbLegacyMatch) return fbLegacyMatch[1];
        // Alternative: https://www.facebook.com/photo.php?fbid=123456789
        const fbPhotoMatch = url.match(/fbid=(\d+)/);
        return fbPhotoMatch ? fbPhotoMatch[1] : null;
        
      case 'instagram':
        // Instagram URLs: https://www.instagram.com/p/ABC123DEF/
        const igMatch = url.match(/\/p\/([A-Za-z0-9_-]+)\//); 
        return igMatch ? igMatch[1] : null;
        
      case 'twitter':
      case 'x':
        // Twitter URLs: https://twitter.com/username/status/123456789
        const twitterMatch = url.match(/\/status\/(\d+)/);
        return twitterMatch ? twitterMatch[1] : null;
        
      case 'youtube':
        // YouTube URLs: https://www.youtube.com/watch?v=ABC123DEF
        const ytMatch = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
        return ytMatch ? ytMatch[1] : null;
        
      case 'tiktok':
        // TikTok URLs: https://www.tiktok.com/@username/video/123456789
        const tiktokMatch = url.match(/\/video\/(\d+)/);
        return tiktokMatch ? tiktokMatch[1] : null;
        
      default:
        // Generic extraction - try to find any numeric ID
        const genericMatch = url.match(/\/(\d+)/); 
        return genericMatch ? genericMatch[1] : null;
    }
  } catch (error) {
    console.warn('Failed to extract post ID from URL:', url, error);
    return null;
  }
}

/**
 * Fetch real metadata from platform APIs (with fallbacks)
 */
async function fetchPlatformMetadata(platform: string, postId: string | null, postUrl: string, post: any) {
  // Default fallback metadata
  const fallbackMetadata = {
    title: generateTitle(post.content),
    description: truncateText(post.content, 120),
    image: post.image_url || null,
    likes: Math.floor(Math.random() * 200) + 10,
    comments: Math.floor(Math.random() * 50) + 2,
    shares: Math.floor(Math.random() * 30) + 1,
    views: Math.floor(Math.random() * 1000) + 100,
    platform_image: getPlatformImage(platform)
  };
  
  try {
    // For now, we'll use fallback data since we don't have API tokens
    // In the future, you can add real API calls here:
    /*
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return await fetchLinkedInMetadata(postId, postUrl);
      case 'facebook': 
        return await fetchFacebookMetadata(postId, postUrl);
      case 'instagram':
        return await fetchInstagramMetadata(postId, postUrl);
      case 'twitter':
      case 'x':
        return await fetchTwitterMetadata(postId, postUrl);
      case 'youtube':
        return await fetchYouTubeMetadata(postId, postUrl);
      case 'tiktok':
        return await fetchTikTokMetadata(postId, postUrl);
    }
    */
    
    // For now, return enhanced fallback data
    return {
      ...fallbackMetadata,
      // Add some platform-specific variations
      ...(platform === 'linkedin' && { 
        title: `${fallbackMetadata.title} | LinkedIn`,
        platform_image: 'https://content.linkedin.com/content/dam/me/brand/en-us/brand-home/logos/In-Blue-Logo.png.original.png'
      }),
      ...(platform === 'facebook' && { 
        title: `${fallbackMetadata.title} | Facebook`,
        platform_image: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg'
      }),
      ...(platform === 'instagram' && { 
        title: `${fallbackMetadata.title} | Instagram`,
        platform_image: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png'
      }),
      ...(platform === 'twitter' && { 
        title: `${fallbackMetadata.title} | X (Twitter)`,
        platform_image: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg'
      }),
      ...(platform === 'youtube' && { 
        title: `${fallbackMetadata.title} | YouTube`,
        platform_image: 'https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png'
      }),
      ...(platform === 'tiktok' && { 
        title: `${fallbackMetadata.title} | TikTok`,
        platform_image: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg'
      })
    };
    
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${platform} post:`, postId, error);
    return fallbackMetadata;
  }
}

/**
 * Get platform logo image URL
 */
function getPlatformImage(platform: string): string {
  const platformImages = {
    linkedin: 'https://content.linkedin.com/content/dam/me/brand/en-us/brand-home/logos/In-Blue-Logo.png.original.png',
    facebook: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
    twitter: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
    x: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
    youtube: 'https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png',
    tiktok: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg'
  };
  
  return platformImages[platform.toLowerCase() as keyof typeof platformImages] || '';
}

/**
 * Extract post ID from platform URL (legacy function - keeping for compatibility)
 */
function extractPostId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /\/posts\/activity-([^\/]+)/, // LinkedIn
    /\/posts\/([^\/]+)/, // Facebook
    /\/p\/([^\/]+)/, // Instagram
    /\/status\/([^\/]+)/, // Twitter
    /watch\?v=([^&]+)/, // YouTube
    /video\/([^\/]+)/, // TikTok
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Generate a title from content
 */
function generateTitle(content: string): string {
  // Take first sentence or first 50 characters
  const firstSentence = content.split('.')[0];
  if (firstSentence.length <= 50) {
    return firstSentence.trim() + (content.includes('.') ? '.' : '');
  }
  return content.substring(0, 47).trim() + '...';
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

export default router;
