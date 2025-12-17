import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import type { JSX } from 'react';

interface ProtectedRouteProps {
    children: JSX.Element;
    requiredRoles?: string[]; // ✅ Add role-based access control
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // ✅ Check authentication
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // ✅ Check role-based access
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        // User doesn't have required role - redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
