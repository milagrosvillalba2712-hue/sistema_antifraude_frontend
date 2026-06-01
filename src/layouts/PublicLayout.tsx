import { Outlet } from 'react-router-dom';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Outlet />
    </div>
  );
};
