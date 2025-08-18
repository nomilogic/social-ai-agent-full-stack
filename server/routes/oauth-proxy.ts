import express, { Request, Response } from 'express';
import { oauthManagerClient } from '../lib/oauthManagerClient';

const router = express.Router();

// Health check to verify OAuth Manager connectivity
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await oauthManagerClient.healthCheck();
    res.json({
      success: true,
      oauthManager: health,
      message: 'OAuth Manager is connected and healthy'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OAuth Manager is not accessible',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Proxy token requests to OAuth Manager
router.get('/token/:userId/:platform', async (req: Request, res: Response) => {
  const { userId, platform } = req.params;

  try {
    const client = oauthManagerClient.createClient();
    client.setUserId(userId);
    const tokenData = await client.getAccessToken(platform);
    res.json(tokenData);
  } catch (error) {
    console.error(`Failed to get token for ${platform}:`, error);
    res.status(404).json({ 
      error: `No ${platform} token found for user`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Proxy connection status to OAuth Manager
router.get('/status/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const client = oauthManagerClient.createClient();
    client.setUserId(userId);
    const connections = await client.getConnectionStatus();
    res.json(connections);
  } catch (error) {
    console.error('Failed to check OAuth status:', error);
    res.status(500).json({ 
      error: 'Failed to check OAuth status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Proxy disconnect requests to OAuth Manager
router.delete('/disconnect/:userId/:platform', async (req: Request, res: Response) => {
  const { userId, platform } = req.params;

  try {
    const client = oauthManagerClient.createClient();
    client.setUserId(userId);
    await client.disconnectPlatform(platform);
    res.json({ success: true, message: `Disconnected from ${platform}` });
  } catch (error) {
    console.error(`Failed to disconnect from ${platform}:`, error);
    res.status(500).json({ 
      error: `Failed to disconnect from ${platform}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
