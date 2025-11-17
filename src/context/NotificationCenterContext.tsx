import React, { 
  createContext, 
  useCallback, 
  useContext, 
  useEffect,
  useMemo, 
  useRef, 
  useState
} from 'react';
import { 
  useLocation,
   useNavigate
} from 'react-router';
import type { NotificationItem, PageInfo, ListParams } from '../services/notifications';
import { 
  listNotifications as apiListNotifications, 
  markAllAsRead as apiMarkAllAsRead,
} from '../services/notifications';

interface NotificationCenterState {
  isOpen: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  loading: boolean;
  error?: string;
  pageInfo: PageInfo;
}

interface NotificationCenterActions {
  open: (opts?: { syncToUrl?: boolean }) => void;
  close: (opts?: { syncToUrl?: boolean }) => void;
  toggle: (opts?: { syncToUrl?: boolean }) => void;
  refresh: () => Promise<void>;
  fetchMore: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (n: number) => void;
}

const NotificationCenterContext = createContext<(NotificationCenterState & NotificationCenterActions) | null>(null);

export const useNotificationCenter = () => {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  return ctx;
};

const QUERY_KEY = 'panel';
const QUERY_VALUE = 'notifications';

export const NotificationCenterProvider: React.FC<{ children: React.ReactNode; urlSync?: boolean }> = ({ children, urlSync = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, size: 20, hasMore: true });

  const mountedRef = useRef(false);
  const fetchingMoreRef = useRef(false);

  const syncUrl = useCallback((open: boolean) => {
    if (!urlSync) return;
    const search = new URLSearchParams(location.search);
    if (open) {
      search.set(QUERY_KEY, QUERY_VALUE);
    } else {
      if (search.get(QUERY_KEY) === QUERY_VALUE) search.delete(QUERY_KEY);
    }
    navigate({ pathname: location.pathname, search: search.toString() ? `?${search.toString()}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate, urlSync]);

  const open = useCallback((opts?: { syncToUrl?: boolean }) => {
    setIsOpen(true);
    if (opts?.syncToUrl ?? urlSync) syncUrl(true);
  }, [syncUrl, urlSync]);

  const close = useCallback((opts?: { syncToUrl?: boolean }) => {
    setIsOpen(false);
    if (opts?.syncToUrl ?? urlSync) syncUrl(false);
  }, [syncUrl, urlSync]);

  const toggle = useCallback((opts?: { syncToUrl?: boolean }) => {
    setIsOpen(prev => {
      const next = !prev;
      if (opts?.syncToUrl ?? urlSync) syncUrl(next);
      return next;
    });
  }, [syncUrl, urlSync]);

  const load = useCallback(async (params?: Partial<ListParams>) => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await apiListNotifications({ page: 1, size: 20, ...params });
      setNotifications(res.items);
      setPageInfo({ page: res.page, size: res.size, hasMore: res.hasMore });
      setUnreadCount(res.unreadCount);
    } catch (e: any) {
      setError(e?.message || '加载通知失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load({ page: 1 });
  }, [load]);

  const fetchMore = useCallback(async () => {
    if (!pageInfo.hasMore || fetchingMoreRef.current) return;
    fetchingMoreRef.current = true;
    try {
      const res = await apiListNotifications({ page: pageInfo.page + 1, size: pageInfo.size });
      setNotifications(prev => [...prev, ...res.items]);
      setPageInfo({ page: res.page, size: res.size, hasMore: res.hasMore });
      setUnreadCount(res.unreadCount);
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [pageInfo.hasMore, pageInfo.page, pageInfo.size]);

  const markAllAsRead = useCallback(async () => {
    await apiMarkAllAsRead();
    // 简单起见：本地直接将 isRead 置为 true，并将未读数清零
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // 初次加载和 URL 同步监听
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (!urlSync) return;
    const qs = new URLSearchParams(location.search);
    const shouldOpen = qs.get(QUERY_KEY) === QUERY_VALUE;
    setIsOpen(shouldOpen);
  }, [location.search, urlSync]);

  const value = useMemo(() => ({
    isOpen,
    unreadCount,
    notifications,
    loading,
    error,
    pageInfo,
    open,
    close,
    toggle,
    refresh,
    fetchMore,
    markAllAsRead,
    setUnreadCount,
  }), [isOpen, unreadCount, notifications, loading, error, pageInfo, open, close, toggle, refresh, fetchMore, markAllAsRead, setUnreadCount]);

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
};
