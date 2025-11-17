import React from 'react';
import { Outlet } from 'react-router';
import './index.scss';

const AccountLayout: React.FC = () => {
  return (
    <div className="account-container">
      <Outlet />
    </div>
  );
};

export default AccountLayout;
