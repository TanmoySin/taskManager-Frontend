import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Project {
    _id: string;
    name: string;
    estimatedHours?: number;
    actualHours?: number;
    timeVariance?: number;
}

interface ProjectTimeWidgetProps {
    projects: Project[];
    isLoading?: boolean;
}

const ProjectTimeWidget: FC<ProjectTimeWidgetProps> = ({ projects, isLoading }) => {
    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
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
        return null;
    }

    // Only show projects with time tracking data
    const projectsWithTime = projects.filter(
        (p) => p.estimatedHours !== undefined || p.actualHours !== undefined
    );

    if (projectsWithTime.length === 0) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        ⏱️ Project Time Tracking
                    </h2>
                </div>
                <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No time tracking data available</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    ⏱️ Project Time Tracking
                </h2>
                <Badge variant="default" size="sm">
                    {projectsWithTime.length} projects
                </Badge>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">
                                Project
                            </th>
                            <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4 hidden sm:table-cell">
                                Estimated
                            </th>
                            <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">
                                Actual
                            </th>
                            <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">
                                Variance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectsWithTime.slice(0, 5).map((project) => {
                            const estimated = project.estimatedHours || 0;
                            const actual = project.actualHours || 0;
                            const variance = actual - estimated;
                            const variancePercent = estimated > 0
                                ? ((variance / estimated) * 100).toFixed(0)
                                : 0;
                            const isOver = variance > 0;

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
                                        </Link>
                                    </td>

                                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                                        <span className="text-sm text-gray-700">
                                            {estimated.toFixed(1)}h
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {actual.toFixed(1)}h
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {Math.abs(variance) > 0.1 && (
                                                <>
                                                    {isOver ? (
                                                        <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                                                    ) : (
                                                        <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                                                    )}
                                                    <Badge
                                                        variant={isOver ? 'danger' : 'success'}
                                                        size="sm"
                                                    >
                                                        {isOver ? '+' : ''}{variancePercent}%
                                                    </Badge>
                                                </>
                                            )}
                                            {Math.abs(variance) <= 0.1 && (
                                                <Badge variant="default" size="sm">
                                                    On track
                                                </Badge>
                                            )}
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

export default ProjectTimeWidget;
