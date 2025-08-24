// static/js/modules/management/management.js
/**
 * Management Module - Real Data Only Implementation
 */
class ManagementModule extends DashboardModule {
    constructor(container) {
        super('Management', container);
        this.currentScenario = 'baseline';
        this.scenarioData = null;
        this.allScenarios = {};
    }

    async onInitialize() {
        console.log('Management module initializing...');

        // Create the HTML structure
        this.render();

        // Subscribe to events
        this.subscribe(DASHBOARD_EVENTS.SCENARIO_CHANGED, this.onScenarioChanged.bind(this));
        this.subscribe(DASHBOARD_EVENTS.DATA_REFRESH, this.loadAllScenarios.bind(this));

        // Load initial data
        await this.loadAllScenarios();
    }

    render() {
        this.container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Workforce</h3>
                    <div class="metric-value" id="totalWorkforce">0</div>
                    <div class="metric-label">mechanics & quality inspectors</div>
                </div>
                <div class="metric-card">
                    <h3>Makespan</h3>
                    <div class="metric-value" id="makespan">0</div>
                    <div class="metric-label">working days</div>
                </div>
                <div class="metric-card">
                    <h3>On-Time Delivery</h3>
                    <div class="metric-value" id="onTimeRate">0%</div>
                    <div class="metric-label">of products</div>
                </div>
                <div class="metric-card">
                    <h3>Avg Utilization</h3>
                    <div class="metric-value" id="avgUtilization">0%</div>
                    <div class="metric-label">across all teams</div>
                </div>
            </div>

            <h3 style="margin: 25px 0 15px; font-size: 18px; color: var(--dark);">Product Delivery Status</h3>
            <div class="product-grid" id="productGrid">
                <!-- Product cards will be populated here -->
            </div>

            <div class="chart-container">
                <div class="chart-header">
                    <div class="chart-title">Team Utilization Analysis</div>
                </div>
                <div class="utilization-bars" id="utilizationChart">
                    <!-- Utilization bars will be populated here -->
                </div>
            </div>

            <!-- Late Parts Impact Analysis -->
            <div class="late-parts-analysis" style="margin-top: 30px;">
                <h3 style="font-size: 18px; color: var(--dark); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">📦</span>
                    Late Parts Impact Analysis
                </h3>
                <div id="latePartsImpactGrid" class="impact-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <!-- Late parts impact cards will be inserted here -->
                </div>
                <div class="late-parts-summary" style="margin-top: 20px; padding: 20px; background: #FEF3C7; border-radius: 10px; border-left: 4px solid #F59E0B;">
                    <h4 style="margin-top: 0; color: #92400E;">Overall Late Parts Impact</h4>
                    <div id="latePartsSummary">
                        <!-- Summary statistics will be inserted here -->
                    </div>
                </div>
            </div>

            <!-- Priority Simulator -->
            <div class="priority-simulator" style="background: white; border-radius: 12px; padding: 25px; margin-top: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1F2937; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🎯</span>
                    Priority Scenario Simulator
                </h3>

                <div class="simulator-controls" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6B7280;">Prioritize Product:</label>
                        <select id="priorityProduct" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                            <option value="">Select Product</option>
                            <option value="Product A">Product A</option>
                            <option value="Product B">Product B</option>
                            <option value="Product C">Product C</option>
                            <option value="Product D">Product D</option>
                            <option value="Product E">Product E</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6B7280;">Priority Level:</label>
                        <select id="priorityLevel" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                            <option value="high">High Priority (+50% resources)</option>
                            <option value="critical">Critical Priority (+75% resources)</option>
                            <option value="exclusive">Exclusive Priority (100% until 50% complete)</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #6B7280;">Simulation Days:</label>
                        <input type="number" id="simDays" value="30" min="7" max="90" style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">
                    </div>

                    <div style="display: flex; align-items: flex-end;">
                        <button id="runSimulationBtn" class="btn btn-primary" style="white-space: nowrap;">
                            Run Simulation
                        </button>
                    </div>
                </div>

                <div id="simulationResults" style="display: none;">
                    <!-- Results will be inserted here -->
                </div>
            </div>
        `;

        // Add event listener for simulation button
        const runSimBtn = this.container.querySelector('#runSimulationBtn');
        if (runSimBtn) {
            runSimBtn.addEventListener('click', () => this.runPrioritySimulation());
        }
    }

    async loadAllScenarios() {
        try {
            this.showLoading('Loading management data...');

            // Get list of scenarios
            const scenariosResponse = await fetch('/api/scenarios');
            const scenariosInfo = await scenariosResponse.json();

            // Load each scenario
            for (const scenario of scenariosInfo) {
                const response = await fetch(`/api/scenario/${scenario}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    this.allScenarios[scenario] = data;
                    console.log(`✓ Loaded ${scenario} for management view`);
                }
            }

            // Set initial scenario
            this.scenarioData = this.allScenarios[this.currentScenario];

            // Update view
            this.updateManagementView();

        } catch (error) {
            console.error('Error loading scenarios:', error);
            this.showError('Failed to load management data');
        } finally {
            this.hideLoading();
        }
    }

    async updateManagementView() {
        if (!this.scenarioData) return;

        // Update metrics - ALL FROM SCENARIO DATA
        document.getElementById('totalWorkforce').textContent = this.scenarioData.totalWorkforce || 0;
        document.getElementById('makespan').textContent = this.scenarioData.makespan || 0;
        document.getElementById('onTimeRate').textContent = (this.scenarioData.onTimeRate || 0) + '%';
        document.getElementById('avgUtilization').textContent = Math.round(this.scenarioData.avgUtilization || 0) + '%';

        // Update product cards with real data
        this.updateProductCards();

        // Update utilization chart with real data
        this.updateUtilizationChart();

        // Update late parts analysis
        await this.updateLatePartsAnalysis();
    }

    updateProductCards() {
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML = '';

        // Use products data from scenario if available
        if (this.scenarioData.products) {
            this.scenarioData.products.forEach(product => {
                const card = this.createProductCard(product);
                productGrid.appendChild(card);
            });
        } else if (this.scenarioData.data) {
            // Group tasks by product if products array not provided
            const products = {};
            this.scenarioData.data.forEach(task => {
                const productName = task.product_line;
                if (!products[productName]) {
                    products[productName] = {
                        name: productName,
                        tasks: [],
                        earliestStart: null,
                        latestEnd: null,
                        criticalTasks: 0,
                        latePartTasks: 0,
                        reworkTasks: 0
                    };
                }

                products[productName].tasks.push(task);

                const start = new Date(task.scheduled_start || task.startTime);
                const end = new Date(task.scheduled_end || task.endTime || start);

                if (!products[productName].earliestStart || start < products[productName].earliestStart) {
                    products[productName].earliestStart = start;
                }
                if (!products[productName].latestEnd || end > products[productName].latestEnd) {
                    products[productName].latestEnd = end;
                }

                if (task.isCritical || (task.slack_hours !== undefined && task.slack_hours < 24)) {
                    products[productName].criticalTasks++;
                }
                if (task.task_type === 'Late Part') {
                    products[productName].latePartTasks++;
                }
                if (task.task_type === 'Rework') {
                    products[productName].reworkTasks++;
                }
            });

            // Create cards for each product
            Object.values(products).forEach(product => {
                const card = this.createProductCard(product);
                productGrid.appendChild(card);
            });
        }
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Use actual delivery date from product data
        const deliveryDate = product.deliveryDate ? new Date(product.deliveryDate) : null;
        const projectedCompletion = product.projectedCompletion ? new Date(product.projectedCompletion) :
                                   product.latestEnd || null;
        const now = new Date();

        // Calculate progress
        let progress = 0;
        if (product.progress !== undefined) {
            progress = product.progress;
        } else if (product.earliestStart && projectedCompletion) {
            const totalDuration = projectedCompletion - product.earliestStart;
            const elapsed = now - product.earliestStart;
            if (elapsed > 0) {
                progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            }
        }

        // Use actual status from data
        let status = 'on-time';
        let statusText = 'ON TIME';
        let daysEarlyOrLate = 0;

        if (product.onTime !== undefined) {
            status = product.onTime ? 'on-time' : 'late';
            statusText = product.onTime ? 'ON TIME' : 'LATE';
            daysEarlyOrLate = product.latenessDays || 0;
        } else if (product.status) {
            status = product.status;
            statusText = status.toUpperCase().replace('-', ' ');
        } else if (deliveryDate && projectedCompletion) {
            const diffTime = projectedCompletion - deliveryDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 5) {
                status = 'late';
                statusText = 'LATE';
                daysEarlyOrLate = diffDays;
            } else if (diffDays > 0) {
                status = 'at-risk';
                statusText = 'AT RISK';
                daysEarlyOrLate = diffDays;
            } else {
                status = 'on-time';
                statusText = 'ON TIME';
                daysEarlyOrLate = Math.abs(diffDays);
            }
        }

        const formatDate = (date) => {
            if (!date) return 'Not scheduled';
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };

        const totalTasks = product.totalTasks || (product.tasks ? product.tasks.length : 0);
        const criticalTasks = product.criticalTasks || product.criticalTaskCount || 0;
        const latePartTasks = product.latePartsCount || product.latePartTasks || 0;
        const reworkTasks = product.reworkCount || product.reworkTasks || 0;

        card.innerHTML = `
            <div class="product-header">
                <div class="product-name">${product.name}</div>
                <div class="status-badge ${status}">${statusText}</div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.round(progress)}%"></div>
            </div>

            ${deliveryDate ? `
            <div class="product-dates">
                <div class="date-row">
                    <span class="date-label">📅 Delivery Date:</span>
                    <span class="date-value">${formatDate(deliveryDate)}</span>
                </div>
                <div class="date-row">
                    <span class="date-label">🏁 Scheduled Finish:</span>
                    <span class="date-value ${status}">${formatDate(projectedCompletion)}</span>
                </div>
            </div>
            ` : ''}

            <div class="product-stats">
                ${deliveryDate ? `<span>📅 ${Math.abs(Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24)))} days remaining</span>` : ''}
                <span>⚡ ${criticalTasks} critical tasks</span>
            </div>

            <div class="product-stats" style="margin-top: 5px; font-size: 11px;">
                <span>Tasks: ${totalTasks}</span>
                ${latePartTasks > 0 ? `<span>📦 Late Parts: ${latePartTasks}</span>` : ''}
                ${reworkTasks > 0 ? `<span>🔧 Rework: ${reworkTasks}</span>` : ''}
            </div>

            ${status === 'late' && daysEarlyOrLate > 0 ? `
                <div style="margin-top: 8px; padding: 5px; background: #fee2e2; border-radius: 4px; font-size: 12px; text-align: center;">
                    <strong>Late by ${daysEarlyOrLate} days</strong>
                </div>
            ` : status === 'at-risk' ? `
                <div style="margin-top: 8px; padding: 5px; background: #fef3c7; border-radius: 4px; font-size: 12px; text-align: center;">
                    <strong>At Risk - ${daysEarlyOrLate} days late</strong>
                </div>
            ` : projectedCompletion && daysEarlyOrLate < 0 ? `
                <div style="margin-top: 8px; padding: 5px; background: #dcfce7; border-radius: 4px; font-size: 12px; text-align: center;">
                    <strong>Early by ${Math.abs(daysEarlyOrLate)} days</strong>
                </div>
            ` : ''}
        `;

        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this.showProductDetails(product.name));

        return card;
    }

    updateUtilizationChart() {
        const utilizationChart = document.getElementById('utilizationChart');
        if (!utilizationChart) return;

        utilizationChart.innerHTML = '';

        // Use ONLY actual utilization data from scenario
        const utilization = this.scenarioData.utilization || {};

        // Sort teams by utilization
        const sortedTeams = Object.entries(utilization)
            .sort((a, b) => b[1] - a[1]);

        if (sortedTeams.length === 0) {
            utilizationChart.innerHTML = '<p style="text-align: center; color: #6b7280;">No utilization data available</p>';
            return;
        }

        // Create utilization bars
        sortedTeams.forEach(([team, util]) => {
            const utilizationItem = document.createElement('div');
            utilizationItem.className = 'utilization-item';

            // Determine color based on utilization level
            let fillColor = 'linear-gradient(90deg, #10b981, #10b981)'; // Green for normal
            if (util > 90) {
                fillColor = 'linear-gradient(90deg, #ef4444, #dc2626)'; // Red for high
            } else if (util > 75) {
                fillColor = 'linear-gradient(90deg, #f59e0b, #d97706)'; // Orange for medium-high
            } else if (util < 30) {
                fillColor = 'linear-gradient(90deg, #6b7280, #4b5563)'; // Gray for low
            }

            utilizationItem.innerHTML = `
                <div class="team-label">${team}</div>
                <div class="utilization-bar">
                    <div class="utilization-fill" style="width: ${Math.min(100, util)}%; background: ${fillColor};">
                        <span class="utilization-percent">${Math.round(util)}%</span>
                    </div>
                </div>
            `;

            utilizationChart.appendChild(utilizationItem);
        });
    }

    async updateLatePartsAnalysis() {
        try {
            const response = await fetch(`/api/late_parts_impact/${this.currentScenario}`);
            let data = null;

            if (response.ok) {
                data = await response.json();
            }

            // Build HTML display
            let html = '';

            // Use data from API if available, otherwise use scenario data
            if (data && data.productImpacts && Object.keys(data.productImpacts).length > 0) {
                const stats = data.overallStatistics || {};

                const totalLateParts = stats.totalLatePartsCount || 0;
                const makespanImpact = stats.totalMakespanImpactDays || stats.totalScheduleImpactDays || 0;
                const avgImpact = stats.averageImpactPerPart || stats.averageDelayPerPart || 0;
                const productsAffected = stats.productsWithLateParts || 0;
                const totalProducts = stats.totalProducts || (this.scenarioData.products ? this.scenarioData.products.length : 0);

                document.getElementById('latePartsSummary').innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #92400E;">${totalLateParts}</div>
                            <div style="font-size: 12px; color: #78350F;">Total Late Parts</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #92400E;">${Number(makespanImpact).toFixed(1)}</div>
                            <div style="font-size: 12px; color: #78350F;">Impact (Days)</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #92400E;">${Number(avgImpact).toFixed(2)}</div>
                            <div style="font-size: 12px; color: #78350F;">Avg per Part</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #92400E;">${productsAffected}/${totalProducts}</div>
                            <div style="font-size: 12px; color: #78350F;">Products Affected</div>
                        </div>
                    </div>
                `;

                // Product cards
                const grid = document.getElementById('latePartsImpactGrid');
                grid.innerHTML = '';

                for (const [productName, impact] of Object.entries(data.productImpacts)) {
                    const latePartCount = impact.latePartCount || 0;
                    const reworkCount = impact.reworkCount || 0;
                    const impactDays = Number(impact.totalMakespanImpact || impact.scheduleImpactDays || 0);

                    const impactLevel = impactDays > 5 ? 'high' :
                                       impactDays > 2 ? 'medium' :
                                       impactDays > 0 ? 'low' : 'none';

                    const cardColor = impactLevel === 'high' ? '#FEE2E2' :
                                     impactLevel === 'medium' ? '#FEF3C7' :
                                     impactLevel === 'low' ? '#D1FAE5' : '#FFFFFF';

                    const borderColor = impactLevel === 'high' ? '#EF4444' :
                                       impactLevel === 'medium' ? '#F59E0B' :
                                       impactLevel === 'low' ? '#10B981' : '#E5E7EB';

                    const cardDiv = document.createElement('div');
                    cardDiv.innerHTML = `
                        <div style="background: ${cardColor}; border: 2px solid ${borderColor}; border-radius: 10px; padding: 20px; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <div>
                                    <h5 style="margin: 0; color: #1F2937; font-size: 16px;">${productName}</h5>
                                    <div style="margin-top: 5px;">
                                        <span style="background: ${impact.onTime ? '#10B981' : '#EF4444'}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                            ${impact.onTime ? 'ON TIME' : `LATE: ${Math.abs(impact.productLatenessDays || 0)} days`}
                                        </span>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 20px; font-weight: bold; color: ${borderColor};">${impactDays.toFixed(1)}</div>
                                    <div style="font-size: 11px; color: #6B7280;">days impact</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                                <div>
                                    <span style="color: #6B7280;">Late Parts:</span>
                                    <strong style="color: #1F2937; margin-left: 5px;">${latePartCount}</strong>
                                </div>
                                <div>
                                    <span style="color: #6B7280;">Rework Tasks:</span>
                                    <strong style="color: #1F2937; margin-left: 5px;">${reworkCount}</strong>
                                </div>
                            </div>
                        </div>
                    `;
                    grid.appendChild(cardDiv);
                }
            } else {
                // Fallback: Use basic data from scenario if available
                const products = this.scenarioData.products || [];
                let totalLateParts = 0;
                let totalRework = 0;
                let productsWithIssues = 0;

                products.forEach(product => {
                    const lateParts = product.latePartsCount || 0;
                    const rework = product.reworkCount || 0;
                    totalLateParts += lateParts;
                    totalRework += rework;
                    if (lateParts > 0 || rework > 0) {
                        productsWithIssues++;
                    }
                });

                if (totalLateParts > 0 || totalRework > 0) {
                    document.getElementById('latePartsSummary').innerHTML = `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #92400E;">${totalLateParts}</div>
                                <div style="font-size: 12px; color: #78350F;">Total Late Parts</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #92400E;">${totalRework}</div>
                                <div style="font-size: 12px; color: #78350F;">Total Rework Tasks</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #92400E;">${productsWithIssues}</div>
                                <div style="font-size: 12px; color: #78350F;">Products Affected</div>
                            </div>
                        </div>
                    `;
                } else {
                    document.getElementById('latePartsSummary').innerHTML =
                        '<p style="text-align: center; color: #6B7280;">No late parts data available for this scenario</p>';
                }

                document.getElementById('latePartsImpactGrid').innerHTML = '';
            }

        } catch (error) {
            console.error('Error loading late parts analysis:', error);
            document.getElementById('latePartsSummary').innerHTML =
                '<p style="text-align: center; color: #EF4444;">Error loading late parts analysis</p>';
        }
    }

    async runPrioritySimulation() {
        const product = document.getElementById('priorityProduct').value;
        const level = document.getElementById('priorityLevel').value;
        const days = document.getElementById('simDays').value;

        if (!product) {
            alert('Please select a product to prioritize');
            return;
        }

        const resultsDiv = document.getElementById('simulationResults');
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = '<div class="loading">Running simulation...</div>';

        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: this.currentScenario,
                    product: product,
                    level: level,
                    days: parseInt(days)
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.displaySimulationResults(result);
            } else {
                resultsDiv.innerHTML = `<div style="color: red;">Simulation failed: ${result.error}</div>`;
            }
        } catch (error) {
            resultsDiv.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    }

    displaySimulationResults(result) {
        const resultsDiv = document.getElementById('simulationResults');

        let html = '<h4>Simulation Results</h4>';
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">';

        // Before column
        html += '<div>';
        html += '<h5>Current State</h5>';
        html += '<ul style="font-size: 13px;">';
        if (result.before) {
            result.before.forEach(product => {
                const status = product.onTime ? '✓' : '✗';
                const days = product.latenessDays > 0 ? `+${product.latenessDays}` : product.latenessDays;
                html += `<li>${status} ${product.name}: ${days} days</li>`;
            });
        }
        html += '</ul>';
        html += '</div>';

        // After column
        html += '<div>';
        html += '<h5>After Prioritization</h5>';
        html += '<ul style="font-size: 13px;">';
        if (result.after) {
            result.after.forEach(product => {
                const status = product.onTime ? '✓' : '✗';
                const days = product.latenessDays > 0 ? `+${product.latenessDays}` : product.latenessDays;
                const change = result.before ?
                    product.latenessDays - result.before.find(p => p.name === product.name).latenessDays : 0;
                const changeStr = change !== 0 ? ` (${change > 0 ? '+' : ''}${change})` : '';
                html += `<li>${status} ${product.name}: ${days} days${changeStr}</li>`;
            });
        }
        html += '</ul>';
        html += '</div>';

        html += '</div>';

        // Impact summary
        if (result.impactScore !== undefined) {
            const impactLevel = result.impactScore > 50 ? 'high-impact' :
                               result.impactScore > 20 ? 'medium-impact' : 'low-impact';

            html += `<div class="impact-result ${impactLevel}" style="margin-top: 15px; padding: 10px; border-radius: 6px;">`;
            html += `<strong>Impact Score: ${result.impactScore}/100</strong><br>`;
            html += `<span style="font-size: 12px;">${result.recommendation || ''}</span>`;
            html += '</div>';
        }

        resultsDiv.innerHTML = html;
    }

    async showProductDetails(productName) {
        try {
            const response = await fetch(`/api/product/${productName}/tasks?scenario=${this.currentScenario}`);
            const data = await response.json();

            if (response.ok) {
                console.log(`Product ${productName} details:`, data);

                let message = `${productName} Details:\n\n`;
                message += `Total Tasks: ${data.totalTasks || 0}\n`;

                if (data.taskBreakdown) {
                    message += `\nTask Breakdown:\n`;
                    for (const [type, count] of Object.entries(data.taskBreakdown)) {
                        message += `  • ${type}: ${count}\n`;
                    }
                }

                if (data.criticalTasks !== undefined) {
                    message += `\nCritical Path Tasks: ${data.criticalTasks}\n`;
                }

                if (data.completionDate) {
                    message += `\nProjected Completion: ${new Date(data.completionDate).toLocaleDateString()}\n`;
                }

                alert(message);
            }
        } catch (error) {
            console.error('Error loading product details:', error);
            alert(`Error loading details for ${productName}`);
        }
    }

    onScenarioChanged(scenario) {
        console.log(`[Management] Scenario changed to ${scenario}`);
        this.currentScenario = scenario;
        this.scenarioData = this.allScenarios[scenario];
        this.updateManagementView();
    }
}

window.ManagementModule = ManagementModule;