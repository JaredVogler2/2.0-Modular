/**
 * Utility functions for the dashboard
 */
const DashboardUtils = {
    // Date/Time formatting
    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    // Task type helpers
    getTaskTypeClass(type) {
        const typeMap = {
            'Production': 'production',
            'Quality Inspection': 'quality',
            'Late Part': 'late-part',
            'Rework': 'rework'
        };
        return typeMap[type] || 'production';
    },

    getTaskTypeColor(type) {
        const colorMap = {
            'Production': '#10b981',
            'Quality Inspection': '#3b82f6',
            'Late Part': '#f59e0b',
            'Rework': '#ef4444'
        };
        return colorMap[type] || '#6b7280';
    }
};

window.DashboardUtils = DashboardUtils;
