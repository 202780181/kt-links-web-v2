import React from 'react'

const AccountAccessPage: React.FC = () => {
  return (
    <section className="account-page account-page--access">
      <header className="account-page__header">
        <h2 className="account-page__title">访问管理</h2>
      </header>
      <div className="account-page__body">
        <div className="account-card">
          <div className="account-card__header">访问密钥</div>
          <div className="account-card__content">
            <div className="account-table">
              <div className="account-table__row"><div>API Key</div><div className="account-table__status">已生成</div><div className="account-table__action">重置</div></div>
              <div className="account-table__row"><div>Access Token</div><div className="account-table__status">有效</div><div className="account-table__action">吊销</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountAccessPage
