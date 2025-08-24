/**
 * Project Module - Minimal Gantt Implementation
 */
class ProjectModule extends DashboardModule {
    constructor(container) {
        super('Project', container);
        this.currentScenario = 'baseline';
        this.gantt = null;
    }

    async onInitialize() {
        console.log('Project module initializing...');

        // Create container for Gantt
        this.container.innerHTML = `
            <div style="padding: 20px;">
                <h3>Project Schedule - ${this.currentScenario}</h3>
                <svg id="gantt"></svg>
            </div>
        `;

        // Subscribe to events
        this.subscribe(DASHBOARD_EVENTS.SCENARIO_CHANGED, this.onScenarioChanged);
        this.subscribe(DASHBOARD_EVENTS.DATA_REFRESH, this.loadData);

        // Load initial data
        await this.loadData();
    }

    async loadData() {
        this.showLoading('Loading project data...');

        try {
            console.log('Loading data for Project - scenario:', this.currentScenario);

            // Use your existing routes
            const response = await fetch(`/${this.currentScenario}`);
            const result = await response.json();

            // Get tasks from your response format
            const tasks = result.tasks || result.data || [];
            console.log(`Loaded ${tasks.length} tasks`);

            if (tasks.length > 0) {
                // Convert to Frappe format
                const ganttTasks = tasks.map(task => ({
                    id: task.taskId || task.task_id || String(Math.random()),
                    name: task.taskId || 'Task',
                    start: task.startTime || task.start_time,
                    end: task.endTime || task.end_time,
                    progress: 0,
                    dependencies: task.dependencies ?
                        (Array.isArray(task.dependencies) ?
                            task.dependencies.map(d => d.taskId || d.task).join(',') :
                            '') : ''
                }));

                // Render Gantt
                this.renderGantt(ganttTasks);
            }

        } catch (error) {
            this.showError(`Failed to load data: ${error.message}`);
            console.error('Error:', error);
        } finally {
            this.hideLoading();
        }
    }

    renderGantt(tasks) {
        // Clear existing
        const svg = document.getElementById('gantt');
        if (svg) {
            svg.innerHTML = '';
        }

        // Create new Gantt chart using Frappe
        this.gantt = new Gantt('#gantt', tasks, {
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            on_click: task => {
                console.log('Task clicked:', task);
            }
        });

        console.log('Gantt chart rendered');
    }

    onScenarioChanged(scenario) {
        this.currentScenario = scenario;
        this.loadData();
    }

    onShow() {
        console.log('Project module shown');
        if (this.gantt) {
            this.gantt.refresh(this.gantt.tasks);
        }
    }

    onHide() {
        console.log('Project module hidden');
    }
}

window.ProjectModule = ProjectModule;