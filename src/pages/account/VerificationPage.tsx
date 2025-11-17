import React from 'react'

const AccountVerificationPage: React.FC = () => {
  return (
    <section className="account-page account-page--verification">
      <header className="account-page__header">
        <h2 className="account-page__title">实名认证</h2>
      </header>
      <div className="account-page__body">
        <div className="account-card">
          <div className="account-card__header">认证信息</div>
          <div className="account-card__content">
            <p>当前认证状态：<span className="account-field__value account-field__value--success">已认证</span></p>
            <p>如需变更认证主体，请提交认证变更申请。</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountVerificationPage
