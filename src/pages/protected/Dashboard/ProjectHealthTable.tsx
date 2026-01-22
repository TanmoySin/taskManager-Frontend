import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Project {
    _id: string;
    name: string;
    projectKey: string;
    progress: number;
    health: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
    overdueTasks: number;
    totalTasks: number;
    completedTasks: number;
    onTimeCompletionRate?: number;
}

interface ProjectHealthTableProps {
    projects: Project[];
    isLoading?: boolean;
}

const ProjectHealthTable: FC<ProjectHealthTableProps> = ({ projects, isLoading }) => {
    const healthConfig = {
        ON_TRACK: {
            label: 'On Track',
            variant: 'success' as const,
            icon: TrendingUp,
            color: 'text-green-600',
        },
        AT_RISK: {
            label: 'At Risk',
            variant: 'warning' as const,
            icon: Minus,
            color: 'text-yellow-600',
        },
        DELAYED: {
            label: 'Delayed',
            variant: 'danger' as const,
            icon: TrendingDown,
            color: 'text-red-600',
        },
    };

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">📈 Project Health</h2>
                </div>
                <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No projects found</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">📈 Project Health</h2>
                <Link
                    to="/projects"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    View All
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                                Project
                            </th>
                            <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4 hidden sm:table-cell">
                                Progress
                            </th>
                            <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                                Health
                            </th>
                            <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4 hidden md:table-cell">
                                Overdue
                            </th>
                            <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">
                                Tasks
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => {
                            const health = healthConfig[project.health];
                            const HealthIcon = health.icon;

                            return (
                                <tr
                                    key={project._id}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <Link
                                            to={`/projects/${project._id}`}
                                            className="block hover:text-blue-600 transition-colors"
                                        >
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {project.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {project.projectKey}
                                            </p>
                                        </Link>
                                    </td>

                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                                <div
                                                    className={`h-full transition-all duration-300 ${project.progress >= 75
                                                        ? 'bg-green-500'
                                                        : project.progress >= 50
                                                            ? 'bg-blue-500'
                                                            : project.progress >= 25
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700 w-10 text-right">
                                                {project.progress}%
                                            </span>
                                        </div>
                                        {project.onTimeCompletionRate !== undefined && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {project.onTimeCompletionRate}% on-time
                                            </p>
                                        )}
                                    </td>

                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5">
                                            <HealthIcon className={`w-4 h-4 ${health.color} hidden sm:block`} />
                                            <Badge variant={health.variant} size="sm">
                                                {health.label}
                                            </Badge>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 text-center hidden md:table-cell">
                                        {project.overdueTasks > 0 ? (
                                            <Badge variant="danger" size="sm">
                                                {project.overdueTasks}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </td>

                                    <td className="py-3 px-4 text-center">
                                        <div className="text-sm text-gray-700">
                                            <span className="font-semibold">{project.completedTasks}</span>
                                            <span className="text-gray-400 mx-1">/</span>
                                            <span>{project.totalTasks}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default ProjectHealthTable;
