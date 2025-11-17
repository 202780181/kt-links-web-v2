import React from 'react'
import { Link } from 'react-router'
import './NotFoundPage.scss'
import NotFoundImg from '@/assets/image/404.png'

const NotFoundPage: React.FC = () => {
  return (
    <div className="notfound">
      <div className="notfound__container">
        <img src={NotFoundImg} alt="404 Not Found" className="notfound__image" />
        <div className="notfound__title">当前页面无法访问，可能由于网址已删除或尚未生效</div>
        <div className="notfound__actions">
          <Link className="notfound__link" to="/overview">控制台概览</Link>
          <Link className="notfound__link" to="/developer">账户中心</Link>
        </div>
        <div className="notfound__search">
          <input className="notfound__input" placeholder="请输入名称、关键字(搜索产品，如：云服务器、容器服务、CDN等)" />
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
