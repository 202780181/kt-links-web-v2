import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNotificationCenter } from '@/context/NotificationCenterContext';
import './index.scss';

const NotificationDrawer: React.FC = () => {
  const { isOpen, close, notifications, loading, error, fetchMore, pageInfo, markAllAsRead } = useNotificationCenter();
  const drawerRef = useRef<HTMLElement | null>(null);

  // 处理 Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // 点击页面其他区域关闭抽屉（无遮罩场景）
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node & { closest?: (sel: string) => Element | null };
      // 若点击来源于小铃铛按钮，则不在此处处理关闭，交由按钮自身的 toggle 处理
      if (typeof (target as any).closest === 'function') {
        const bell = (target as any).closest('.notification-bell');
        if (bell) return;
      }
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        close();
      }
    };
    // 使用捕获阶段，尽量早于内部点击处理
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [isOpen, close]);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className={`nc-container ${isOpen ? 'nc-container--visible' : ''}`} aria-hidden={!isOpen}>
      <aside ref={drawerRef} className={`nc-drawer ${isOpen ? 'nc-drawer--open' : ''}`} role="dialog" aria-label="通知中心">
        <header className="nc-drawer__header">
          <h3 className="nc-drawer__title">站内信</h3>
          <div className="nc-drawer__actions">
            <button className="nc-btn" onClick={() => markAllAsRead()}>全部已读</button>
            <button className="nc-btn nc-btn--ghost" onClick={() => close()}>关闭</button>
          </div>
        </header>

        <div className="nc-drawer__body">
          {loading && notifications.length === 0 && (
            <div className="nc-empty">加载中...</div>
          )}
          {error && (
            <div className="nc-error">{error}</div>
          )}
          {!loading && notifications.length === 0 && !error && (
            <div className="nc-empty">暂无通知</div>
          )}

          <ul className="nc-list">
            {notifications.map(n => (
              <li key={n.id} className={`nc-item ${n.isRead ? '' : 'nc-item--unread'}`}>
                <div className="nc-item__meta">
                  <span className="nc-item__cat">{n.subTitle || n.category || '通知'}</span>
                  <time className="nc-item__time">{new Date(n.createdAt).toLocaleString()}</time>
                </div>
                <div className="nc-item__title">
                  {n.link ? (
                    <a href={n.link}>{n.title}</a>
                  ) : (
                    <span>{n.title}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {pageInfo.hasMore && (
            <div className="nc-footer">
              <button className="nc-btn" onClick={() => fetchMore()}>加载更多</button>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
};

export default NotificationDrawer;
