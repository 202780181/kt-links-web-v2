import React from 'react'

const AccountSecurityPage: React.FC = () => {
  return (
    <section className="account-page account-page--security">
      <header className="account-page__header">
        <h2 className="account-page__title">安全设置</h2>
      </header>
      <div className="account-page__body">
        <div className="account-card">
          <div className="account-card__header">安全项</div>
          <div className="account-card__content">
            <div className="account-table">
              <div className="account-table__row"><div>登录保护</div><div className="account-table__status">已开启</div><div className="account-table__action">管理</div></div>
              <div className="account-table__row"><div>二次验证</div><div className="account-table__status">未开启</div><div className="account-table__action">开启</div></div>
              <div className="account-table__row"><div>敏感操作校验</div><div className="account-table__status">已开启</div><div className="account-table__action">管理</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountSecurityPage
