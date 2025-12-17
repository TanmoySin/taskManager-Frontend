import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import type { JSX } from 'react';

export default function PublicRoute({ children }: { children: JSX.Element }) {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    // ✅ Authenticated users redirected to dashboard
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
