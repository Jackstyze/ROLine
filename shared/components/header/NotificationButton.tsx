'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from '@/features/notifications/actions/notifications.actions'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_ICONS: Record<string, string> = {
  order: '📦',
  message: '💬',
  promo: '🎁',
  system: '🔔',
  wishlist: '❤️',
}

export function NotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const [notifs, count] = await Promise.all([
      getNotifications(10),
      getUnreadCount()
    ])
    setNotifications(notifs)
    setUnreadCount(count)
  }

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      await markAsRead(id)
      await loadNotifications()
    })
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsRead()
      await loadNotifications()
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-green-600 hover:text-green-700"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex items-start gap-3 px-3 py-3 cursor-pointer ${
                  !notif.is_read ? 'bg-green-50' : ''
                }`}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <span className="text-xl">{TYPE_ICONS[notif.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''} text-gray-900`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-gray-500 truncate">{notif.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0 mt-2" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
