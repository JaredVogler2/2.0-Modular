/**
 * Centralized API client for dashboard
 */
class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Check for pending request to prevent duplicates
        const requestKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body)}`;
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }

        const requestPromise = fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }).then(response => {
            this.pendingRequests.delete(requestKey);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            return response.json();
        }).catch(error => {
            this.pendingRequests.delete(requestKey);
            throw error;
        });

        this.pendingRequests.set(requestKey, requestPromise);
        return requestPromise;
    }

    // Scenario APIs
    async getScenarios() {
        return this.request('/api/scenarios');
    }

    async getScenarioData(scenarioId) {
        return this.request(`/api/scenario/${scenarioId}`);
    }

    // Team APIs
    async getTeamTasks(teamName, filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/api/team/${teamName}/tasks?${params}`);
    }

    async generateAssignments(teamName, data) {
        return this.request(`/api/team/${teamName}/generate_assignments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Task APIs
    async assignTask(taskId, mechanicId, scenario) {
        return this.request('/api/assign_task', {
            method: 'POST',
            body: JSON.stringify({ taskId, mechanicId, scenario })
        });
    }

    // Analytics APIs
    async getLatePartsImpact(scenarioId) {
        return this.request(`/api/late_parts_impact/${scenarioId}`);
    }

    async simulatePriority(data) {
        return this.request('/api/simulate_priority', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Export API
    async exportScenario(scenarioId) {
        window.location.href = `/api/export/${scenarioId}`;
    }
}

window.DashboardAPI = new APIClient();
