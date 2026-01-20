import { type FC } from 'react';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { useAppSelector } from '../../../store/hooks';

const Dashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    // Route to appropriate dashboard based on role
    if (user?.role === 'Administrator') {
        return <AdminDashboard />;
    }

    if (user?.role === 'Manager') {
        return <ManagerDashboard />;
    }

    // Employee and Client see employee dashboard
    return <EmployeeDashboard />;
};

export default Dashboard;
