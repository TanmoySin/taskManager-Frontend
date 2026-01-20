import { type FC } from 'react';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import Badge from '../../../components/ui/Badge';

interface DeadlineBadgeProps {
    dueDate: string | Date;
    status: string;
    size?: 'sm' | 'md';
    showIcon?: boolean;
}

const DeadlineBadge: FC<DeadlineBadgeProps> = ({
    dueDate,
    status,
    size = 'sm',
    showIcon = true,
}) => {
    if (!dueDate || status === 'DONE') return null;

    const now = new Date();
    const due = new Date(dueDate);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Calculate days difference
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let variant: 'danger' | 'warning' | 'info' | 'default' = 'default';
    let icon = Clock;
    let label = '';
    let emoji = '';

    if (due < now) {
        // Overdue
        const daysOverdue = Math.abs(diffDays);
        variant = 'danger';
        icon = AlertCircle;
        emoji = '🔴';
        label = daysOverdue === 0 ? 'Overdue today' : `${daysOverdue}d overdue`;
    } else if (due <= todayEnd) {
        // Due today
        variant = 'warning';
        icon = Calendar;
        emoji = '🟡';
        label = 'Due today';
    } else if (due <= weekEnd) {
        // Due this week
        variant = 'info';
        icon = Clock;
        emoji = '🟠';
        const dayName = due.toLocaleDateString('en-US', { weekday: 'short' });
        label = `Due ${dayName}`;
    } else {
        // Future
        variant = 'default';
        icon = Calendar;
        emoji = '🟢';
        label = diffDays <= 30 ? `${diffDays}d left` : due.toLocaleDateString();
    }

    const Icon = icon;

    return (
        <Badge variant={variant} size={size}>
            <div className="flex items-center gap-1">
                {showIcon && <Icon className="w-3 h-3" />}
                <span>
                    {emoji} {label}
                </span>
            </div>
        </Badge>
    );
};

export default DeadlineBadge;
