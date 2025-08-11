import { Router, Request, Response } from 'express';
import { serverSupabaseAnon as serverSupabase } from '../supabaseClient';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Interface for notification data
interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'campaign' | 'post';
  action_url?: string;
  metadata?: any;
}

// Get all notifications for the authenticated user
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: notifications, error } = await serverSupabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Error in GET /notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { count, error } = await serverSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ error: 'Failed to fetch unread count' });
    }

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in GET /notifications/unread-count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new notification
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, message, type, action_url, metadata }: Omit<NotificationData, 'user_id'> = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !message || !type) {
      return res.status(400).json({ error: 'Title, message, and type are required' });
    }

    const notificationData: NotificationData = {
      user_id: userId,
      title,
      message,
      type,
      action_url,
      metadata
    };

    const { data: notification, error } = await serverSupabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error in POST /notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: notification, error } = await serverSupabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Error in PATCH /notifications/:id/read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read for the user
router.patch('/mark-all-read', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: notifications, error } = await serverSupabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }

    res.json({ notifications, count: notifications?.length || 0 });
  } catch (error) {
    console.error('Error in PATCH /notifications/mark-all-read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a notification
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: notification, error } = await serverSupabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /notifications/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all notifications for the user
router.delete('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: notifications, error } = await serverSupabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error clearing notifications:', error);
      return res.status(500).json({ error: 'Failed to clear notifications' });
    }

    res.json({ message: 'All notifications cleared successfully', count: notifications?.length || 0 });
  } catch (error) {
    console.error('Error in DELETE /notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper endpoint to create notification triggers for specific events
router.post('/trigger/:event', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const eventType = req.params.event;
    const { data } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let notification: Partial<NotificationData> = {
      user_id: userId
    };

    // Handle different event types
    switch (eventType) {
      case 'post-published':
        notification = {
          ...notification,
          title: 'Post Published Successfully',
          message: `Your post "${data.title || 'Untitled'}" has been published to ${data.platforms?.join(', ') || 'social media'}.`,
          type: 'success',
          action_url: `/posts/${data.postId}`,
          metadata: { postId: data.postId, platforms: data.platforms }
        };
        break;

      case 'post-scheduled':
        notification = {
          ...notification,
          title: 'Post Scheduled',
          message: `Your post has been scheduled for ${data.scheduledTime}.`,
          type: 'info',
          action_url: `/schedule`,
          metadata: { postId: data.postId, scheduledTime: data.scheduledTime }
        };
        break;

      case 'campaign-created':
        notification = {
          ...notification,
          title: 'Campaign Created',
          message: `Campaign "${data.name}" has been created successfully.`,
          type: 'success',
          action_url: `/campaigns/${data.campaignId}`,
          metadata: { campaignId: data.campaignId, name: data.name }
        };
        break;

      case 'campaign-reminder':
        notification = {
          ...notification,
          title: 'Campaign Reminder',
          message: `Don't forget about your "${data.name}" campaign. Next post scheduled for ${data.nextPostTime}.`,
          type: 'reminder',
          action_url: `/campaigns/${data.campaignId}`,
          metadata: { campaignId: data.campaignId, nextPostTime: data.nextPostTime }
        };
        break;

      case 'oauth-disconnected':
        notification = {
          ...notification,
          title: 'Platform Disconnected',
          message: `Your ${data.platform} account has been disconnected. Reconnect to continue posting.`,
          type: 'warning',
          action_url: `/settings/platforms`,
          metadata: { platform: data.platform }
        };
        break;

      case 'post-failed':
        notification = {
          ...notification,
          title: 'Post Failed',
          message: `Failed to publish your post to ${data.platform}. Please check your connection and try again.`,
          type: 'error',
          action_url: `/posts/${data.postId}`,
          metadata: { postId: data.postId, platform: data.platform, error: data.error }
        };
        break;

      default:
        return res.status(400).json({ error: 'Unknown event type' });
    }

    // Create the notification
    const { data: createdNotification, error } = await serverSupabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) {
      console.error('Error creating triggered notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }

    res.status(201).json({ notification: createdNotification });
  } catch (error) {
    console.error('Error in POST /notifications/trigger/:event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
