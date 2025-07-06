// Utility functions for notification permissions

export const checkNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getNotificationPermissionStatus = (): {
  supported: boolean;
  permission: NotificationPermission;
  isMobile: boolean;
} => {
  return {
    supported: isNotificationSupported(),
    permission: checkNotificationPermission(),
    isMobile: isMobileDevice(),
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

export const getBrowserInstructions = (browser: string): string[] => {
  const instructions = {
    chrome: [
      'Tap the three dots (⋮) in the top right',
      'Tap "Settings"',
      'Tap "Site settings"',
      'Tap "Notifications"',
      'Find this website and tap it',
      'Change to "Allow"',
      'Refresh the page'
    ],
    safari: [
      'Tap the "AA" button in the address bar',
      'Tap "Website Settings"',
      'Tap "Notifications"',
      'Change to "Allow"',
      'Refresh the page'
    ],
    firefox: [
      'Tap the menu button (☰)',
      'Tap "Settings"',
      'Tap "Site permissions"',
      'Tap "Notifications"',
      'Find this website and tap it',
      'Change to "Allow"',
      'Refresh the page'
    ],
    desktop: [
      'Click the lock icon in the address bar',
      'Change notifications from "Block" to "Allow"',
      'Refresh the page'
    ]
  };

  return instructions[browser as keyof typeof instructions] || instructions.desktop;
}; 