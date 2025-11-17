// 通知服务层：你可在此接入真实后端 API。
// 当前提供一个可替换的模拟实现，便于前端联调。

export interface NotificationItem {
  id: string;
  title: string;
  subTitle?: string;
  category?: string;
  createdAt: string; // ISO string
  isRead: boolean;
  link?: string;
}

export interface ListParams {
  page: number;
  size: number;
}

export interface ListResponse {
  items: NotificationItem[];
  page: number;
  size: number;
  hasMore: boolean;
  unreadCount: number;
}

export interface PageInfo {
  page: number;
  size: number;
  hasMore: boolean;
}

// 模拟数据
let MOCK_UNREAD = 5;
function genMock(page: number, size: number): ListResponse {
  const total = 36;
  const start = (page - 1) * size;
  const end = Math.min(start + size, total);
  const items: NotificationItem[] = [];
  for (let i = start; i < end; i++) {
    items.push({
      id: String(i + 1),
      title: `系统通知 ${i + 1}`,
      subTitle: i % 3 === 0 ? '运维消息' : '产品消息',
      category: i % 3 === 0 ? 'ops' : 'product',
      createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      isRead: i >= MOCK_UNREAD,
      link: i % 2 === 0 ? '/audit' : undefined,
    });
  }
  return {
    items,
    page,
    size,
    hasMore: end < total,
    unreadCount: MOCK_UNREAD,
  };
}

export async function listNotifications(params: ListParams): Promise<ListResponse> {
  // TODO: 替换为真实请求
  await new Promise(r => setTimeout(r, 200));
  return genMock(params.page, params.size);
}

export async function markAllAsRead(): Promise<void> {
  await new Promise(r => setTimeout(r, 120));
  MOCK_UNREAD = 0;
}
