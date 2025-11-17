import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from '../../router/index.tsx';
import ClientAuthService from '../../services/clientAuthService.ts';
import { AuthProvider } from '../../context/AuthContext.tsx';
import ErrorPage from '../ErrorModal/index.tsx';
import Loading from '../Loading/index.tsx';

type InitStatus = 'loading' | 'success' | 'error';

interface AppInitializerState {
  status: InitStatus;
  error?: string;
  errorTitle?: string;
  errorMessage?: string;
}

const AppInitializer: React.FC = () => {
  const [state, setState] = useState<AppInitializerState>({
    status: 'loading'
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 添加超时处理
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30秒超时
        });

        // 执行客户端认证，带超时
        await Promise.race([
          ClientAuthService.initialize(),
          timeoutPromise
        ]);

        setState({ status: 'success' });
      } catch (error) {
        console.error('应用初始化失败:', error);

        // 检查错误类型并设置相应的错误状态
        if (error instanceof Error) {
          if (error.message === 'CLIENT_NOT_SUPPORTED') {
            setState({
              status: 'error',
              error: 'CLIENT_NOT_SUPPORTED',
              errorTitle: '不支持的客户端',
              errorMessage: '当前浏览器不支持此客户端，请使用最新版本的 Safari、Chrome 或 Firefox 浏览器。'
            });
          } else if (error.message === 'SESSION_EXPIRED') {
            setState({
              status: 'error',
              error: 'SESSION_EXPIRED',
              errorTitle: '会话已过期',
              errorMessage: '客户端会话已过期，请重新刷新页面进行认证。'
            });
          } else if (error.message === 'TIMEOUT') {
            setState({
              status: 'error',
              error: 'TIMEOUT',
              errorTitle: '连接超时',
              errorMessage: '客户端认证请求超时，请检查网络连接后重试。'
            });
          } else {
            setState({
              status: 'error',
              error: 'UNKNOWN',
              errorTitle: '初始化失败',
              errorMessage: '应用初始化失败，请重试。如果问题持续存在，请联系技术支持。'
            });
          }
        } else {
          // 未知错误，直接显示应用
          setState({ status: 'success' });
        }
      }
    };

    initializeApp();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  // 渲染不同状态
  switch (state.status) {
    case 'loading':
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          margin: 0,
          padding: 0
        }}>
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Loading type="app" />
            <p style={{
              marginTop: '16px',
              color: '#6b7280',
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: '16px 0 0 0'
            }}>
              正在初始化客户端..
            </p>
          </div>
        </div>
      );

    case 'error':
      return (
        <ErrorPage
          title={state.errorTitle!}
          message={state.errorMessage!}
          onRetry={handleRetry}
        />
      );

    case 'success':
    default:
      return (
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      );
  }
};

export default AppInitializer;
