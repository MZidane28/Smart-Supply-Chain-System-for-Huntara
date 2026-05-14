import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { InventarisPage } from './pages/InventarisPage';
import { OptimisiAIPage } from './pages/OptimisiAIPage';
import { KonstruksiBIMPage } from './pages/KonstruksiBIMPage';
import { LogistikPemetaanPage } from './pages/LogistikPemetaanPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'inventaris', Component: InventarisPage },
      { path: 'optimasi', Component: OptimisiAIPage },
      { path: 'konstruksi', Component: KonstruksiBIMPage },
      { path: 'logistik', Component: LogistikPemetaanPage },
    ],
  },
]);
