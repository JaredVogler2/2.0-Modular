/**
 * Main Dashboard Application Controller
 */
class DashboardApp {
    constructor() {
        this.modules = new Map();
        this.currentView = null;
        this.currentScenario = 'baseline';
        this.eventBus = window.DashboardEvents;
        this.api = window.DashboardAPI;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Dashboard App...');
        
        try {
            // Register modules
            await this.registerModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Activate default view
            this.switchView('team-lead');
            
            this.initialized = true;
            console.log('Dashboard App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        }
    }

    async registerModules() {
        // Register each module
        const moduleConfigs = [
            {
                name: 'team-lead',
                className: window.TeamLeadModule,
                container: document.getElementById('team-lead-view')
            },
            {
                name: 'management',
                className: window.ManagementModule,
                container: document.getElementById('management-view')
            },
            {
                name: 'mechanic',
                className: window.MechanicModule,
                container: document.getElementById('mechanic-view')
            },
            {
                name: 'project',
                className: window.ProjectModule,
                container: document.getElementById('project-view')
            }
        ];

        for (const config of moduleConfigs) {
            if (config.className && config.container) {
                const module = new config.className(config.container);
                this.modules.set(config.name, module);
                console.log(`Registered module: ${config.name}`);
            }
        }
    }

    setupEventListeners() {
        // View tab switching
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Scenario selection
        const scenarioSelect = document.getElementById('scenarioSelect');
        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', (e) => {
                this.switchScenario(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    async loadInitialData() {
        try {
            // Load scenarios
            const scenarios = await this.api.getScenarios();
            console.log('Loaded scenarios:', scenarios);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async switchView(viewName) {
        if (this.currentView === viewName) return;
        
        console.log(`Switching to view: ${viewName}`);
        
        // Hide current module
        if (this.currentView && this.modules.has(this.currentView)) {
            const currentModule = this.modules.get(this.currentView);
            currentModule.hide();
        }
        
        // Show new module
        if (this.modules.has(viewName)) {
            const newModule = this.modules.get(viewName);
            
            // Initialize if needed
            if (!newModule.initialized) {
                await newModule.initialize();
            }
            
            newModule.show();
            this.currentView = viewName;
            
            // Update UI
            this.updateViewTabs(viewName);
            
            // Emit event
            this.eventBus.emit(DASHBOARD_EVENTS.VIEW_CHANGED, viewName);
        }
    }

    async switchScenario(scenarioId) {
        if (this.currentScenario === scenarioId) return;
        
        console.log(`Switching to scenario: ${scenarioId}`);
        this.currentScenario = scenarioId;
        
        // Emit event for all modules
        this.eventBus.emit(DASHBOARD_EVENTS.SCENARIO_CHANGED, scenarioId);
    }

    async refreshData() {
        console.log('Refreshing all data...');
        this.eventBus.emit(DASHBOARD_EVENTS.DATA_REFRESH);
    }

    updateViewTabs(activeView) {
        document.querySelectorAll('.view-tab').forEach(tab => {
            if (tab.dataset.view === activeView) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${activeView}-view`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.DashboardApp = new DashboardApp();
    await window.DashboardApp.initialize();
});
