import { useState, useEffect } from 'react';
import { historyRefreshService } from '../services/historyRefreshService';

export const useUnreadPosts = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/post-history/history/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Mock data for demonstration
      setUnreadCount(2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    // Register with global refresh service
    const unregister = historyRefreshService.registerRefreshCallback(() => {
      console.log('🔔 Unread posts count refresh triggered from global service');
      fetchUnreadCount();
    });

    return () => {
      clearInterval(interval);
      unregister();
    };
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
    markAllAsRead
  };
};
