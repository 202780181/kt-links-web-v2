import React, { useState } from 'react'
import { useNavigate } from 'react-router'
// 使用简单的图标替代 lucide-react
const Eye = () => <span>👁️</span>
const EyeOff = () => <span>🙈</span>
const Mail = () => <span>📧</span>
const Lock = () => <span>🔒</span>
const ArrowRight = () => <span>→</span>
import { useAuth } from '../../context/AuthContext'
import './index.scss'
import { LoginForm } from '@/components/ui/login-form'

interface LoginForm {
  account: string
  password: string
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [form, setForm] = useState<LoginForm>({
    account: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.account || !form.password) {
      setError('请输入账号和密码')
      return
    }

    setError('')

    try {
      await login(form.account, form.password)

      // 登录成功，跳转到首页
      navigate('/')
    } catch (error) {
      console.error('登录失败:', error)
      if (error instanceof Error) {
        if (error.message === 'INVALID_CREDENTIALS') {
          setError('账号或密码错误')
        } else if (error.message === 'SESSION_EXPIRED') {
          setError('会话已过期，请刷新页面重试')
        } else if (error.message === 'CLIENT_NOT_SUPPORTED') {
          setError('客户端认证失败，请刷新页面重试')
        } else {
          setError('登录失败，请稍后重试')
        }
      } else {
        setError('登录失败，请稍后重试')
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-logo">
              <div className="logo-icon">KT</div>
            </div>
            <h1 className="brand-title">KT Things</h1>
            <p className="brand-subtitle">智能物联网管理平台</p>
          </div>

          <div className="login-illustration">
            <div className="illustration-bg">
              <div className="floating-card card-1">
                <div className="card-icon">📊</div>
                <div className="card-text">数据分析</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🔗</div>
                <div className="card-text">设备连接</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">⚡</div>
                <div className="card-text">实时监控</div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="login-header">
              <h2>欢迎回来</h2>
              <p>登录您的账户以继续使用</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="account">账号</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail />
                  </span>
                  <input
                    id="account"
                    type="text"
                    placeholder="请输入您的账号"
                    value={form.account}
                    onChange={(e) =>
                      handleInputChange('account', e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">密码</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入您的密码"
                    value={form.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="login-button"
                disabled={loading || !form.account || !form.password}
              >
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    登录
                    <ArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                遇到问题？
                <a href="#" className="help-link">
                  联系技术支持
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
