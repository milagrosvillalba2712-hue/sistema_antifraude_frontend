import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

export const PublicLayout = () => (
  <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Outlet />
  </Layout>
);
