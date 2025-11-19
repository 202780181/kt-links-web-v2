import React from 'react';
import { Outlet } from 'react-router';

const AccountLayout: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Outlet />
    </div>
  );
};

export default AccountLayout;
