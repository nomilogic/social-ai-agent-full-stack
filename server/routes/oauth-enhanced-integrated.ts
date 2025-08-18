import express, { Request, Response } from 'express';
import { oauthManager } from '../lib/OAuthManager';

const router = express.Router();

// GET /api/oauth/:platform/connect - Start OAuth flow for any platform
router.post('/:platform/connect', async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.headers['x-user-id'] as string || req.body.userId;
  const options = req.body.options || {};

  console.log(`Starting OAuth flow for ${platform}, user: ${userId}`);

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Check if platform is configured
    if (!oauthManager.isPlatformConfigured(platform)) {
      return res.status(400).json({ 
        error: `${platform} OAuth is not configured. Please add client credentials to environment variables.` 
      });
    }

    const { authUrl, state } = await oauthManager.getAuthURL(platform, userId, options);
    
    res.json({
      success: true,
      authUrl,
      state,
      platform
    });
  } catch (error) {
    console.error(`OAuth initiation error for ${platform}:`, error);
    res.status(500).json({ 
      error: `Failed to initiate OAuth for ${platform}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/oauth/:platform/callback - Handle OAuth callback for any platform
router.get('/:platform/callback', async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;

  console.log(`OAuth callback for ${platform}:`, { code: !!code, state, error });

  if (error) {
    console.error(`OAuth error for ${platform}:`, error);
    return res.send(`
      <script>
        window.opener.postMessage({
          type: 'OAUTH_ERROR', 
          platform: '${platform}', 
          error: '${error}'
        }, '*'); 
        window.close();
      </script>
    `);
  }

  if (!code || !state) {
    return res.send(`
      <script>
        window.opener.postMessage({
          type: 'OAUTH_ERROR', 
          platform: '${platform}', 
          error: 'Missing code or state parameter'
        }, '*'); 
        window.close();
      </script>
    `);
  }

  try {
    const connectionData = await oauthManager.handleCallback(
      platform, 
      code as string, 
      state as string
    );

    res.send(`
      <script>
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS', 
          platform: '${platform}',
          username: '${connectionData.userProfile.username || connectionData.userProfile.name}',
          profilePicture: '${connectionData.userProfile.profile_picture_url || ''}',
          connectedAt: ${connectionData.connectedAt}
        }, '*'); 
        window.close();
      </script>
    `);
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
    
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'OAUTH_ERROR', 
          platform: '${platform}', 
          error: '${errorMessage}'
        }, '*'); 
        window.close();
      </script>
    `);
  }
});

// POST /api/oauth/:platform/disconnect - Disconnect from platform
router.post('/:platform/disconnect', async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.headers['x-user-id'] as string || req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const success = await oauthManager.disconnect(userId, platform);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Successfully disconnected from ${platform}` 
      });
    } else {
      res.status(404).json({ 
        error: `No connection found for ${platform}` 
      });
    }
  } catch (error) {
    console.error(`Disconnect error for ${platform}:`, error);
    res.status(500).json({ 
      error: `Failed to disconnect from ${platform}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/oauth/connections/status/:userId - Get connection status for all platforms
router.get('/connections/status/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const connections = await oauthManager.getConnectionStatus(userId);
    res.json(connections);
  } catch (error) {
    console.error('Failed to get connection status:', error);
    res.status(500).json({ 
      error: 'Failed to get connection status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/oauth/connections/:platform/:userId - Get specific platform connection
router.get('/connections/:platform/:userId', async (req: Request, res: Response) => {
  const { platform, userId } = req.params;

  try {
    const connections = await oauthManager.getConnectionStatus(userId);
    const connection = connections[platform];
    
    if (!connection) {
      return res.status(404).json({ error: `No connection found for ${platform}` });
    }

    res.json(connection);
  } catch (error) {
    console.error(`Failed to get ${platform} connection:`, error);
    res.status(500).json({ 
      error: `Failed to get ${platform} connection`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/oauth/tokens/:platform/:userId - Get access token for platform
router.get('/tokens/:platform/:userId', async (req: Request, res: Response) => {
  const { platform, userId } = req.params;

  try {
    const accessToken = await oauthManager.getAccessToken(userId, platform);
    res.json({ access_token: accessToken });
  } catch (error) {
    console.error(`Failed to get access token for ${platform}:`, error);
    
    if (error instanceof Error && error.message.includes('No connection found')) {
      res.status(404).json({ error: `No ${platform} connection found for user` });
    } else {
      res.status(500).json({ 
        error: `Failed to get access token for ${platform}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// GET /api/oauth/config/platforms - Get configured platforms
router.get('/config/platforms', (req: Request, res: Response) => {
  try {
    const configuredPlatforms = oauthManager.getConfiguredPlatforms();
    const platformInfo = configuredPlatforms.map(platform => ({
      name: platform,
      configured: true,
      displayName: platform.charAt(0).toUpperCase() + platform.slice(1)
    }));

    res.json({
      success: true,
      platforms: platformInfo,
      total: platformInfo.length
    });
  } catch (error) {
    console.error('Failed to get platform config:', error);
    res.status(500).json({ 
      error: 'Failed to get platform configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/oauth/health - Health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const configuredPlatforms = oauthManager.getConfiguredPlatforms();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      storage: 'supabase',
      platforms: configuredPlatforms,
      message: 'OAuth Manager is running with Supabase storage'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy routes for compatibility with existing code
// GET /api/oauth/status/:userId - Get connection status (legacy)
router.get('/status/:userId', async (req: Request, res: Response) => {
  // Redirect to new endpoint
  const { userId } = req.params;
  try {
    const connections = await oauthManager.getConnectionStatus(userId);
    res.json(connections);
  } catch (error) {
    console.error('Failed to get OAuth status:', error);
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

// GET /api/oauth/token/:userId/:platform - Get token (legacy)  
router.get('/token/:userId/:platform', async (req: Request, res: Response) => {
  // Redirect to new endpoint
  const { userId, platform } = req.params;
  
  try {
    const accessToken = await oauthManager.getAccessToken(userId, platform);
    res.json({ access_token: accessToken });
  } catch (error) {
    res.status(404).json({ error: `No ${platform} token found` });
  }
});

export default router;
