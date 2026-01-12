// components/NotificationPanel.js
import React from 'react';

export const NotificationPanel = ({
  notifications = [],
  onProfile,
  onSettings,
  onLogout,
  onMarkAllRead,
  user = { name: 'Admin', email: '' }
}) => {
  function BellIcon(props) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }

  function BellAlertIcon(props) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {notifications.length} New
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <BellIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="mt-3 text-sm font-medium text-gray-900">No notifications</h4>
            <p className="mt-1 text-sm text-gray-500">We'll notify you when something arrives</p>
          </li>
        ) : (
          notifications.map((notif, index) => (
            <li key={index} className="p-4 hover:bg-gray-50 transition duration-150 cursor-pointer">
              <div className="flex items-start">
                <div className={`flex-shrink-0 p-2 rounded-full ${notif.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {notif.icon || <BellAlertIcon className="h-5 w-5" />}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{notif.title || 'Notification'}</p>
                    <time className="text-xs text-gray-500">{notif.time}</time>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  {notif.action && (
                    <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800">
                      {notif.action}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

     {notifications.length > 0 && (
  <div className="border-t border-gray-100 bg-gray-50 p-3 text-center">
    <button
      className="text-sm font-medium text-blue-600 hover:text-blue-800"
      onClick={onMarkAllRead}
    >
      Mark all as read
    </button>
  </div>
)}
    </div>
  );
};

export default NotificationPanel;
