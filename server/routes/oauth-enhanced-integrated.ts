import express, { Request, Response } from 'express';
import { oauthManager } from '../lib/OAuthManager';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// POST /api/oauth/:platform/connect - Start OAuth flow for any platform (protected)
router.post('/:platform/connect', authenticateJWT, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.user!.id; // Extract from authenticated JWT token
  const options = req.body.options || {};

  console.log(`Starting OAuth flow for ${platform}, user: ${userId}`);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
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
console.log("OUAAAAUT")
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
     //   window.close();
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
        //window.close();
      </script>
    `);
  }

  try {
    const connectionData = await oauthManager.handleCallback(
      platform, 
      code as string, 
      state as string
    );

    const username = (connectionData.userProfile.username || connectionData.userProfile.name || '').replace(/'/g, "\\'");
    const profilePicture = (connectionData.userProfile.profile_picture_url || '').replace(/'/g, "\\'");
    
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'oauth_success', 
          platform: '${platform}',
          username: '${username}',
          profilePicture: '${profilePicture}',
          connectedAt: ${connectionData.connectedAt}
        }, '*'); 
        //window.close();
      </script>
    `);
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    const errorMessage = (error instanceof Error ? error.message : 'OAuth failed').replace(/'/g, "\\'");
    
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'oauth_error', 
          platform: '${platform}', 
          error: '${errorMessage}'
        }, '*'); 
        //window.close();
      </script>
    `);
  }
});

// POST /api/oauth/:platform/disconnect - Disconnect from platform (protected)
router.post('/:platform/disconnect', authenticateJWT, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.user!.id; // Extract from authenticated JWT token

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
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

// GET /api/oauth/connections/status - Get connection status for authenticated user
router.get('/connections/status', authenticateJWT, async (req: Request, res: Response) => {
  const userId = req.user!.id; // Extract from authenticated JWT token

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

// GET /api/oauth/connections/:platform - Get specific platform connection for authenticated user
router.get('/connections/:platform', authenticateJWT, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.user!.id; // Extract from authenticated JWT token

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

// GET /api/oauth/tokens/:platform - Get access token for platform for authenticated user
router.get('/tokens/:platform', authenticateJWT, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.user!.id; // Extract from authenticated JWT token

  try {
    // Get both connection status and access token
    const connections = await oauthManager.getConnectionStatus(userId);
    const connection = connections[platform];
    
    if (!connection || !connection.connected) {
      return res.json({ 
        connected: false, 
        expired: false,
        token: null 
      });
    }
    
    if (connection.expired) {
      return res.json({ 
        connected: false, 
        expired: true,
        token: null 
      });
    }
    
    // Get the actual access token (this handles refresh if needed)
    const accessToken = await oauthManager.getAccessToken(userId, platform);
    
    res.json({ 
      connected: true,
      expired: false,
      token: {
        access_token: accessToken
      }
    });
  } catch (error) {
    console.error(`Failed to get access token for ${platform}:`, error);
    
    if (error instanceof Error && error.message.includes('No connection found')) {
      res.json({ 
        connected: false, 
        expired: false,
        token: null 
      });
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
  console.log(`Redirecting status check for user: ${req.params.userId}`);
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
