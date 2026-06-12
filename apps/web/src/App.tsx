import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router/routes';

export function App() {
  return <RouterProvider router={router} />;
}
