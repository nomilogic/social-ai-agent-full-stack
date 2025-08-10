// Service Worker for Push Notifications
const CACHE_NAME = 'social-agent-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = {
        title: 'Social Agent Notification',
        body: event.data.text() || 'You have a new notification',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      };
    }
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    tag: notificationData.tag || 'social-agent-notification',
    requireInteraction: notificationData.requireInteraction || false,
    data: notificationData.data || {},
    actions: getNotificationActions(notificationData.type),
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Social Agent',
      options
    )
  );
});

// Get appropriate actions based on notification type
function getNotificationActions(type) {
  switch (type) {
    case 'post_reminder':
      return [
        {
          action: 'edit',
          title: 'Edit Post',
          icon: '/icon-edit-72x72.png'
        },
        {
          action: 'view',
          title: 'View Post',
          icon: '/icon-view-72x72.png'
        }
      ];
    case 'post_published':
      return [
        {
          action: 'view',
          title: 'View Post',
          icon: '/icon-view-72x72.png'
        },
        {
          action: 'analytics',
          title: 'View Analytics',
          icon: '/icon-analytics-72x72.png'
        }
      ];
    case 'campaign_update':
      return [
        {
          action: 'view_campaign',
          title: 'View Campaign',
          icon: '/icon-campaign-72x72.png'
        }
      ];
    case 'daily_summary':
      return [
        {
          action: 'view_dashboard',
          title: 'View Dashboard',
          icon: '/icon-dashboard-72x72.png'
        }
      ];
    default:
      return [
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-close-72x72.png'
        }
      ];
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let url = '/';
  
  switch (action) {
    case 'edit':
      if (data.postId) {
        url = `/posts/${data.postId}/edit`;
      }
      break;
    case 'view':
      if (data.postId) {
        url = `/posts/${data.postId}`;
      }
      break;
    case 'view_campaign':
      if (data.campaignId) {
        url = `/campaigns/${data.campaignId}`;
      }
      break;
    case 'view_dashboard':
      url = '/dashboard';
      break;
    case 'analytics':
      url = '/analytics';
      break;
    case 'dismiss':
      return; // Just close the notification
    default:
      // Default click behavior - open the app
      url = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate to the desired URL
            return client.focus().then(() => {
              return client.navigate(url);
            });
          }
        }
        // No existing window, open new one
        return clients.openWindow(url);
      })
      .catch((error) => {
        console.error('Service Worker: Error handling notification click', error);
      })
  );
});

// Background sync for scheduled notifications
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'schedule-notifications') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Check for scheduled notifications that need to be sent
async function checkScheduledNotifications() {
  try {
    // This would typically fetch from your server
    // For now, we'll check localStorage
    const response = await fetch('/api/notifications/scheduled');
    if (response.ok) {
      const scheduledNotifications = await response.json();
      
      const now = new Date();
      
      for (const notification of scheduledNotifications) {
        const scheduledTime = new Date(notification.scheduledTime);
        
        if (scheduledTime <= now && !notification.isSent) {
          // Send the notification
          await self.registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: notification.id,
            data: notification.data,
            actions: getNotificationActions(notification.type)
          });
          
          // Mark as sent
          await fetch(`/api/notifications/${notification.id}/sent`, {
            method: 'PATCH'
          });
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Error checking scheduled notifications', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    checkScheduledNotifications();
  }
});
