/**
 * Project Module - Gantt Chart with Fresh Schedule Loading
 */
class ProjectModule extends DashboardModule {
    constructor(container) {
        super('Project', container);
        this.currentScenario = 'baseline';
        this.gantt = null;
        this.loadCount = 0;  // Track how many times we've loaded
    }

    async onInitialize() {
        console.log('Project module initializing...');

        // Create container for Gantt with load indicator
        this.container.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Project Schedule - <span id="scenario-label">${this.currentScenario}</span></h3>
                    <div style="font-size: 12px; color: #666;">
                        Load #<span id="load-count">0</span> |
                        Generated: <span id="generation-time">-</span> |
                        Tasks: <span id="task-count">0</span>
                    </div>
                </div>
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
        this.showLoading('Loading fresh schedule data...');
        this.loadCount++;

        try {
            console.log(`[Project] Loading data for ${this.currentScenario} (Load #${this.loadCount})`);

            // Add timestamp to prevent any browser caching
            const timestamp = Date.now();
            const response = await fetch(`/${this.currentScenario}?_t=${timestamp}`);
            const result = await response.json();

            // Get tasks from response
            const tasks = result.tasks || result.data || [];
            console.log(`[Project] Received ${tasks.length} tasks from server`);

            // Debug: Log first few tasks to see dates
            if (tasks.length > 0) {
                console.log('[Project] Sample tasks:');
                tasks.slice(0, 3).forEach((task, i) => {
                    console.log(`  Task ${i+1}: ${task.taskId || task.task_id} - Start: ${task.startTime || task.start_time}`);
                });
            }

            // Update UI indicators
            document.getElementById('load-count').textContent = this.loadCount;
            document.getElementById('generation-time').textContent = new Date().toLocaleTimeString();
            document.getElementById('task-count').textContent = tasks.length;
            document.getElementById('scenario-label').textContent = this.currentScenario;

            if (tasks.length > 0) {
                // Convert to Frappe format
                const ganttTasks = tasks.map(task => {
                    // Handle different field names
                    const taskId = task.taskId || task.task_id || String(Math.random());
                    const startTime = task.startTime || task.start_time;
                    const endTime = task.endTime || task.end_time;

                    return {
                        id: taskId,
                        name: task.display_name || taskId,
                        start: startTime,
                        end: endTime,
                        progress: 0,
                        dependencies: task.dependencies ?
                            (Array.isArray(task.dependencies) ?
                                task.dependencies.map(d => d.taskId || d.task).join(',') :
                                '') : '',
                        custom_class: this.getTaskClass(task)
                    };
                });

                console.log(`[Project] Rendering ${ganttTasks.length} tasks in Gantt chart`);
                this.renderGantt(ganttTasks);
            } else {
                console.warn('[Project] No tasks to display');
                document.getElementById('gantt').innerHTML = '<text x="10" y="30">No tasks scheduled</text>';
            }

        } catch (error) {
            this.showError(`Failed to load data: ${error.message}`);
            console.error('[Project] Error loading data:', error);
        } finally {
            this.hideLoading();
        }
    }

    getTaskClass(task) {
        // Add visual distinction for task types
        const taskType = task.task_type || task.taskType || 'Production';
        const classMap = {
            'Production': 'gantt-task-production',
            'Quality Inspection': 'gantt-task-quality',
            'Late Part': 'gantt-task-late',
            'Rework': 'gantt-task-rework'
        };
        return classMap[taskType] || 'gantt-task-default';
    }

    renderGantt(tasks) {
        console.log(`[Project] Rendering Gantt with ${tasks.length} tasks`);

        // Clear existing
        const svg = document.getElementById('gantt');
        if (svg) {
            svg.innerHTML = '';
        }

        try {
            // Create new Gantt chart using Frappe
            this.gantt = new Gantt('#gantt', tasks, {
                view_mode: 'Day',
                date_format: 'YYYY-MM-DD',
                on_click: task => {
                    console.log('[Project] Task clicked:', task);
                    alert(`Task: ${task.name}\nStart: ${task._start.format('MMM DD, HH:mm')}\nEnd: ${task._end.format('MMM DD, HH:mm')}`);
                },
                on_view_change: (mode) => {
                    console.log('[Project] View mode changed to:', mode);
                }
            });

            console.log('[Project] Gantt chart rendered successfully');

            // Add custom styles for task types
            this.addCustomStyles();

        } catch (error) {
            console.error('[Project] Error rendering Gantt:', error);
            this.showError(`Failed to render Gantt chart: ${error.message}`);
        }
    }

    addCustomStyles() {
        // Add custom CSS for task types if not already added
        if (!document.getElementById('gantt-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'gantt-custom-styles';
            style.textContent = `
                .gantt-task-production { fill: #10b981 !important; }
                .gantt-task-quality { fill: #3b82f6 !important; }
                .gantt-task-late { fill: #f59e0b !important; }
                .gantt-task-rework { fill: #ef4444 !important; }
                .gantt-task-default { fill: #6b7280 !important; }
            `;
            document.head.appendChild(style);
        }
    }

    onScenarioChanged(scenario) {
        console.log(`[Project] Scenario changed from ${this.currentScenario} to ${scenario}`);
        this.currentScenario = scenario;
        this.loadData();  // This will always load fresh data now
    }

    onShow() {
        console.log('[Project] Module shown');
        if (this.gantt) {
            this.gantt.refresh(this.gantt.tasks);
        }
    }

    onHide() {
        console.log('[Project] Module hidden');
    }
}

window.ProjectModule = ProjectModule;