// static/js/modules/team-lead/team-lead.js
/**
 * Team Lead Module - Full Implementation with Real Data
 */
class TeamLeadModule extends DashboardModule {
    constructor(container) {
        super('TeamLead', container);
        this.currentScenario = 'baseline';
        this.selectedTeam = 'all';
        this.selectedShift = 'all';
        this.selectedProduct = 'all';
        this.scenarioData = {};
        this.allScenarios = {};
    }

    async onInitialize() {
        console.log('TeamLead module initializing...');

        // Create the HTML structure
        this.render();

        // Setup internal event listeners
        this.setupEventListeners();

        // Subscribe to global events
        this.subscribe(DASHBOARD_EVENTS.SCENARIO_CHANGED, this.onScenarioChanged.bind(this));
        this.subscribe(DASHBOARD_EVENTS.DATA_REFRESH, this.loadAllScenarios.bind(this));

        // Load initial data
        await this.loadAllScenarios();
    }

    render() {
        this.container.innerHTML = `
            <div id="scenarioInfo"></div>

            <div class="team-filters">
                <div class="filter-group">
                    <label>Team:</label>
                    <select id="teamSelect">
                        <option value="all">All Teams</option>
                        <option value="Mechanic Team 1">Mechanic Team 1</option>
                        <option value="Mechanic Team 2">Mechanic Team 2</option>
                        <option value="Mechanic Team 3">Mechanic Team 3</option>
                        <option value="Mechanic Team 4">Mechanic Team 4</option>
                        <option value="Quality Team 1">Quality Team 1</option>
                        <option value="Quality Team 2">Quality Team 2</option>
                        <option value="Quality Team 3">Quality Team 3</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Shift:</label>
                    <select id="shiftSelect">
                        <option value="all">All Shifts</option>
                        <option value="1st">1st Shift (6:00 AM - 2:30 PM)</option>
                        <option value="2nd">2nd Shift (2:30 PM - 11:00 PM)</option>
                        <option value="3rd">3rd Shift (11:00 PM - 6:00 AM)</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Product:</label>
                    <select id="productSelect">
                        <option value="all">All Products</option>
                    </select>
                </div>
            </div>

            <div class="team-stats">
                <div class="stat-card">
                    <h3>Team Capacity</h3>
                    <div class="value" id="teamCapacity">0</div>
                    <div class="subtext">mechanics available</div>
                </div>
                <div class="stat-card">
                    <h3>Tasks Today</h3>
                    <div class="value" id="tasksToday">0</div>
                    <div class="subtext">to be completed</div>
                </div>
                <div class="stat-card">
                    <h3>Utilization</h3>
                    <div class="value" id="teamUtilization">0%</div>
                    <div class="subtext">current shift</div>
                </div>
                <div class="stat-card">
                    <h3>Critical Tasks</h3>
                    <div class="value" id="criticalTasks">0</div>
                    <div class="subtext">high priority</div>
                </div>
                <div id="taskTypeSummary" class="stat-card"></div>
            </div>

            <div class="task-table-container">
                <div class="table-header">
                    <h3>Task Priority List (Top 30)</h3>
                    <div class="table-actions">
                        <button class="btn btn-secondary" id="exportBtn">📥 Export</button>
                        <button class="btn btn-primary" id="autoAssignBtn">⚡ Auto-Assign</button>
                        <button class="btn btn-primary" id="generateAssignmentsBtn">
                            👥 Generate Individual Assignments
                        </button>
                    </div>
                </div>
                <table id="taskTable">
                    <thead>
                        <tr>
                            <th>Priority</th>
                            <th>Task ID</th>
                            <th>Type</th>
                            <th>Product</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Mechanics</th>
                            <th>Assign To</th>
                        </tr>
                    </thead>
                    <tbody id="taskTableBody">
                    </tbody>
                </table>
            </div>
        `;
    }

    setupEventListeners() {
        const teamSelect = this.container.querySelector('#teamSelect');
        if (teamSelect) {
            teamSelect.addEventListener('change', (e) => {
                this.selectedTeam = e.target.value;
                this.updateTeamLeadView();
            });
        }

        const shiftSelect = this.container.querySelector('#shiftSelect');
        if (shiftSelect) {
            shiftSelect.addEventListener('change', (e) => {
                this.selectedShift = e.target.value;
                this.updateTeamLeadView();
            });
        }

        const productSelect = this.container.querySelector('#productSelect');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                this.selectedProduct = e.target.value;
                this.updateTeamLeadView();
            });
        }

        const exportBtn = this.container.querySelector('#exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTasks());
        }

        const autoAssignBtn = this.container.querySelector('#autoAssignBtn');
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', () => this.autoAssign());
        }

        const generateAssignmentsBtn = this.container.querySelector('#generateAssignmentsBtn');
        if (generateAssignmentsBtn) {
            generateAssignmentsBtn.addEventListener('click', () =>
                this.openTeamAssignmentModal(this.selectedTeam)
            );
        }
    }

    async loadAllScenarios() {
        try {
            this.showLoading('Loading scenario data...');

            // Get list of scenarios
            const scenariosResponse = await fetch('/api/scenarios');
            const scenariosInfo = await scenariosResponse.json();

            // Load each scenario
            for (const scenario of scenariosInfo) {
                const response = await fetch(`/api/scenario/${scenario}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    this.allScenarios[scenario] = data;
                    console.log(`✓ Loaded ${scenario}: ${data.count} tasks`);
                } else {
                    console.error(`✗ Failed to load ${scenario}:`, data.error);
                }
            }

            // Set initial scenario
            this.scenarioData = this.allScenarios[this.currentScenario] || {};

            // Update view
            this.updateProductFilter();
            this.showScenarioInfo();
            this.updateTeamLeadView();

        } catch (error) {
            console.error('Error loading scenarios:', error);
            this.showError('Failed to load scenario data. Please refresh the page.');
        } finally {
            this.hideLoading();
        }
    }

    showScenarioInfo() {
        const infoBanner = this.container.querySelector('#scenarioInfo');
        if (!infoBanner || !this.scenarioData) return;

        let infoHTML = `<strong>${this.currentScenario.toUpperCase()}</strong>: `;

        if (this.scenarioData.makespan) {
            infoHTML += `Makespan: ${this.scenarioData.makespan} days`;
        }
        if (this.scenarioData.totalWorkforce) {
            infoHTML += `, Workforce: ${this.scenarioData.totalWorkforce}`;
        }
        if (this.scenarioData.maxLateness !== undefined) {
            if (this.scenarioData.maxLateness > 0) {
                infoHTML += `, Max lateness: ${this.scenarioData.maxLateness} days`;
            } else {
                infoHTML += `, All products on time`;
            }
        }

        infoBanner.innerHTML = infoHTML;
        infoBanner.style.cssText = 'background: #f0f9ff; border: 1px solid var(--primary); border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 14px;';
    }

    updateProductFilter() {
        const productSelect = this.container.querySelector('#productSelect');
        if (!productSelect || !this.scenarioData.data) return;

        const currentSelection = productSelect.value;
        productSelect.innerHTML = '<option value="all">All Products</option>';

        // Get unique products from tasks
        const products = new Set();
        this.scenarioData.data.forEach(task => {
            if (task.product_line) {
                products.add(task.product_line);
            }
        });

        // Add product options
        [...products].sort().forEach(product => {
            const option = document.createElement('option');
            option.value = product;

            // Count tasks for this product
            const taskCount = this.scenarioData.data.filter(t => t.product_line === product).length;
            option.textContent = `${product} (${taskCount} tasks)`;
            productSelect.appendChild(option);
        });

        // Restore selection if possible
        if ([...productSelect.options].some(opt => opt.value === currentSelection)) {
            productSelect.value = currentSelection;
        } else {
            productSelect.value = 'all';
            this.selectedProduct = 'all';
        }
    }

    async updateTeamLeadView() {
        if (!this.scenarioData || !this.scenarioData.data) return;

        // Filter tasks based on selections
        let tasks = this.scenarioData.data.filter(task => {
            const teamMatch = this.selectedTeam === 'all' || task.team === this.selectedTeam;
            const shiftMatch = this.selectedShift === 'all' || task.shift === this.selectedShift;
            const productMatch = this.selectedProduct === 'all' || task.product_line === this.selectedProduct;
            return teamMatch && shiftMatch && productMatch;
        });

        // Update team capacity from scenario data
        let teamCapacity = 0;
        if (this.selectedTeam === 'all' && this.scenarioData.teamCapacities) {
            teamCapacity = Object.values(this.scenarioData.teamCapacities).reduce((a, b) => a + b, 0);
        } else if (this.scenarioData.teamCapacities && this.scenarioData.teamCapacities[this.selectedTeam]) {
            teamCapacity = this.scenarioData.teamCapacities[this.selectedTeam];
        }
        document.getElementById('teamCapacity').textContent = teamCapacity;

        // Count tasks for today
        const today = new Date();
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.scheduled_start || t.startTime);
            return taskDate.toDateString() === today.toDateString();
        });
        document.getElementById('tasksToday').textContent = todayTasks.length;

        // Calculate utilization
        let utilization = 0;
        if (this.selectedTeam === 'all' && this.scenarioData.avgUtilization) {
            utilization = this.scenarioData.avgUtilization;
        } else if (this.scenarioData.utilization && this.scenarioData.utilization[this.selectedTeam]) {
            utilization = this.scenarioData.utilization[this.selectedTeam];
        }
        document.getElementById('teamUtilization').textContent = Math.round(utilization) + '%';

        // Count critical tasks
        const critical = tasks.filter(t =>
            t.priority_score <= 10 ||
            t.task_type === 'Late Part' ||
            t.task_type === 'Rework' ||
            t.isCritical ||
            (t.slack_hours !== undefined && t.slack_hours < 24)
        ).length;
        document.getElementById('criticalTasks').textContent = critical;

        // Count task types
        const taskTypeCounts = {};
        let latePartTasks = 0;
        let reworkTasks = 0;

        tasks.forEach(task => {
            const type = task.task_type || 'Production';
            taskTypeCounts[type] = (taskTypeCounts[type] || 0) + 1;

            if (task.task_type === 'Late Part') latePartTasks++;
            if (task.task_type === 'Rework') reworkTasks++;
        });

        // Update task type summary
        this.updateTaskTypeSummary(taskTypeCounts, latePartTasks, reworkTasks);

        // Update task table
        this.updateTaskTable(tasks);
    }

    updateTaskTypeSummary(taskTypeCounts, latePartCount, reworkCount) {
        const summaryDiv = this.container.querySelector('#taskTypeSummary');
        if (!summaryDiv) return;

        let summaryHTML = '<h3>Task Type Breakdown</h3><div style="display: flex; gap: 15px; margin-top: 10px;">';

        for (const [type, count] of Object.entries(taskTypeCounts)) {
            const color = this.getTaskTypeColor(type);
            summaryHTML += `
                <div style="flex: 1;">
                    <div style="font-size: 18px; font-weight: bold; color: ${color};">${count}</div>
                    <div style="font-size: 11px; color: #6b7280;">${type}</div>
                </div>
            `;
        }

        summaryHTML += '</div>';

        if (latePartCount > 0 || reworkCount > 0) {
            summaryHTML += '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">';
            summaryHTML += `<span style="margin-right: 15px;">📦 Late Parts: ${latePartCount}</span>`;
            summaryHTML += `<span>🔧 Rework: ${reworkCount}</span>`;
            summaryHTML += '</div>';
        }

        summaryDiv.innerHTML = summaryHTML;
        summaryDiv.style.gridColumn = 'span 2';
    }

    updateTaskTable(tasks) {
        const tbody = this.container.querySelector('#taskTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Sort tasks by start time and show top 30
        tasks.sort((a, b) => {
            const aStart = new Date(a.scheduled_start || a.startTime || 0);
            const bStart = new Date(b.scheduled_start || b.startTime || 0);
            return aStart - bStart;
        });

        tasks.slice(0, 30).forEach(task => {
            const row = tbody.insertRow();
            const startTime = new Date(task.scheduled_start || task.startTime);

            // Add special indicators
            let typeIndicator = '';
            if (task.task_type === 'Late Part') typeIndicator = ' 📦';
            else if (task.task_type === 'Rework') typeIndicator = ' 🔧';
            else if (task.isCritical || (task.slack_hours !== undefined && task.slack_hours < 24)) typeIndicator = ' ⚡';

            // Show dependencies if any
            let dependencyInfo = '';
            if (task.dependencies && task.dependencies.length > 0) {
                const deps = task.dependencies.slice(0, 3).map(d =>
                    typeof d === 'object' ? (d.taskId || d.id || d.task_id) : d
                ).join(', ');
                const more = task.dependencies.length > 3 ? ` +${task.dependencies.length - 3} more` : '';
                dependencyInfo = `<span style="color: #6b7280; font-size: 11px;">Deps: ${deps}${more}</span>`;
            }

            row.innerHTML = `
                <td class="priority">${task.global_priority || task.priority_score || '-'}</td>
                <td class="task-id">${task.task_id || task.taskId}${typeIndicator}</td>
                <td><span class="task-type ${this.getTaskTypeClass(task.task_type || 'Production')}">${task.task_type || 'Production'}</span></td>
                <td>${task.product_line || ''}<br>${dependencyInfo}</td>
                <td>${this.formatDateTime(startTime)}</td>
                <td>${task.duration_minutes || task.duration || 0} min</td>
                <td>${task.mechanics_required || 1}</td>
                <td>
                    <select class="assign-select" data-task-id="${task.task_id || task.taskId}">
                        <option value="">Unassigned</option>
                        <option value="mech1">John Smith</option>
                        <option value="mech2">Jane Doe</option>
                        <option value="mech3">Bob Johnson</option>
                        <option value="mech4">Alice Williams</option>
                    </select>
                </td>
            `;

            // Highlight special rows
            if (task.task_type === 'Late Part') {
                row.style.backgroundColor = '#fef3c7';
            } else if (task.task_type === 'Rework') {
                row.style.backgroundColor = '#fee2e2';
            } else if (task.isCritical || (task.slack_hours !== undefined && task.slack_hours < 24)) {
                row.style.backgroundColor = '#dbeafe';
            }
        });
    }

    openTeamAssignmentModal(teamName) {
        if (!teamName || teamName === 'all') {
            alert('Please select a specific team (not "All Teams")');
            return;
        }

        // Get required capacity from current scenario
        const requiredCapacity = this.scenarioData.teamCapacities ?
            this.scenarioData.teamCapacities[teamName] || 0 : 0;

        if (requiredCapacity === 0) {
            alert(`${teamName} has no required capacity in ${this.currentScenario}. This team may not be needed for this scenario.`);
            return;
        }

        // Create assignment modal similar to original
        const modal = document.createElement('div');
        modal.className = 'assignment-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            width: 90%;
            max-width: 1200px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;

        const isQualityTeam = teamName.toLowerCase().includes('quality');
        const roleLabel = isQualityTeam ? 'Quality Inspector' : 'Mechanic';

        modalContent.innerHTML = `
            <h2 style="margin-top: 0;">Daily Assignment - ${teamName}</h2>
            <button onclick="this.closest('.assignment-modal').remove()"
                    style="position: absolute; top: 20px; right: 20px;
                           background: none; border: none; font-size: 24px; cursor: pointer; color: #6B7280;">×</button>

            <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #3B82F6;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    <div>
                        <label style="font-size: 12px; color: #1E40AF; display: block; font-weight: 600;">SCENARIO REQUIREMENT</label>
                        <div style="font-size: 32px; font-weight: bold; color: #1E40AF;">${requiredCapacity}</div>
                        <div style="font-size: 11px; color: #1E40AF;">${roleLabel}s needed</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3>Mark Attendance - Who's Here Today?</h3>
                <p style="color: #6B7280; margin-bottom: 15px;">
                    ${this.currentScenario} requires ${requiredCapacity} ${roleLabel.toLowerCase()}s for ${teamName}.
                    Uncheck anyone who is absent.
                </p>

                <div id="attendanceList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
                    ${this.generateMechanicCheckboxes(teamName, requiredCapacity, roleLabel)}
                </div>
            </div>

            <button onclick="window.teamLeadModule.generateAssignments('${teamName}')"
                    class="btn btn-primary"
                    style="width: 100%; padding: 14px; font-size: 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Generate Individual Assignments
            </button>

            <div id="assignmentResults" style="margin-top: 30px;">
                <!-- Results will appear here -->
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    generateMechanicCheckboxes(teamName, capacity, roleLabel) {
        let html = '';
        for (let i = 1; i <= capacity; i++) {
            html += `
                <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #E5E7EB; border-radius: 6px; cursor: pointer;">
                    <input type="checkbox"
                           value="${teamName} ${roleLabel} #${i}"
                           checked
                           style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                    <div>
                        <div style="font-weight: 500; color: #1F2937; font-size: 14px;">${roleLabel} #${i}</div>
                        <div style="font-size: 11px; color: #6B7280;">${teamName}</div>
                    </div>
                </label>
            `;
        }
        return html;
    }

    async generateAssignments(teamName) {
        // Get checked mechanics (present ones)
        const checkboxes = document.querySelectorAll('#attendanceList input[type="checkbox"]:checked');
        const presentMechanics = Array.from(checkboxes).map(cb => cb.value);

        if (presentMechanics.length === 0) {
            alert('Please select at least one mechanic who is present');
            return;
        }

        const resultsDiv = document.getElementById('assignmentResults');
        resultsDiv.innerHTML = '<div class="loading">Generating optimal assignments...</div>';

        try {
            const response = await fetch(`/api/team/${teamName}/generate_assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: this.currentScenario,
                    presentMechanics: presentMechanics,
                    date: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate assignments');
            }

            // Display results (simplified version)
            resultsDiv.innerHTML = `
                <h3>Assignment Results</h3>
                <p>Successfully generated assignments for ${presentMechanics.length} ${teamName} members.</p>
                <button class="btn btn-secondary" onclick="alert('Export functionality would go here')">
                    📥 Export Assignments
                </button>
            `;

        } catch (error) {
            resultsDiv.innerHTML = `
                <div style="background: #FEE2E2; border: 1px solid #EF4444; padding: 15px; border-radius: 8px;">
                    <strong>❌ Error generating assignments</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    async autoAssign() {
        const selects = this.container.querySelectorAll('.assign-select');
        const mechanics = ['mech1', 'mech2', 'mech3', 'mech4'];
        let mechanicIndex = 0;
        let assignmentCount = 0;

        for (const select of selects) {
            const taskId = select.dataset.taskId;
            const mechanicId = mechanics[mechanicIndex % mechanics.length];

            try {
                const response = await fetch('/api/assign_task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId: taskId,
                        mechanicId: mechanicId,
                        scenario: this.currentScenario
                    })
                });

                if (response.ok) {
                    select.value = mechanicId;
                    assignmentCount++;
                }
            } catch (error) {
                console.error('Error assigning task:', error);
            }

            mechanicIndex++;
        }

        alert(`Successfully assigned ${assignmentCount} tasks to mechanics!`);
    }

    exportTasks() {
        window.location.href = `/api/export/${this.currentScenario}`;
    }

    onScenarioChanged(scenario) {
        console.log(`[TeamLead] Scenario changed to ${scenario}`);
        this.currentScenario = scenario;
        this.scenarioData = this.allScenarios[scenario] || {};
        this.updateProductFilter();
        this.showScenarioInfo();
        this.updateTeamLeadView();
    }

    // Helper methods
    getTaskTypeClass(type) {
        const typeMap = {
            'Production': 'production',
            'Quality Inspection': 'quality',
            'Late Part': 'late-part',
            'Rework': 'rework'
        };
        return typeMap[type] || 'production';
    }

    getTaskTypeColor(type) {
        const colorMap = {
            'Production': '#10b981',
            'Quality Inspection': '#3b82f6',
            'Late Part': '#f59e0b',
            'Rework': '#ef4444'
        };
        return colorMap[type] || '#6b7280';
    }

    formatDateTime(date) {
        if (!date || isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}

window.TeamLeadModule = TeamLeadModule;