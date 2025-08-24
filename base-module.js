/**
 * Base class for all dashboard modules
 */
class DashboardModule {
    constructor(name, container) {
        this.name = name;
        this.container = container;
        this.initialized = false;
        this.eventBus = window.DashboardEvents;
        this.api = window.DashboardAPI;
        this.state = {};
        this.subscriptions = [];
    }

    // Lifecycle methods
    async initialize() {
        if (this.initialized) return;
        
        console.log(`Initializing module: ${this.name}`);
        await this.onInitialize();
        this.initialized = true;
        this.eventBus.emit(DASHBOARD_EVENTS.MODULE_LOADED, this.name);
    }

    async destroy() {
        if (!this.initialized) return;
        
        console.log(`Destroying module: ${this.name}`);
        this.unsubscribeAll();
        await this.onDestroy();
        this.initialized = false;
        this.eventBus.emit(DASHBOARD_EVENTS.MODULE_UNLOADED, this.name);
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.onShow();
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.onHide();
        }
    }

    // Event handling
    subscribe(event, callback) {
        this.eventBus.on(event, callback, this);
        this.subscriptions.push({ event, callback });
    }

    unsubscribeAll() {
        this.subscriptions.forEach(sub => {
            this.eventBus.off(sub.event, sub.callback);
        });
        this.subscriptions = [];
    }

    emit(event, ...args) {
        this.eventBus.emit(event, ...args);
    }

    // State management
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.onStateChanged(updates);
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }

    // Override these in child classes
    async onInitialize() {}
    async onDestroy() {}
    onShow() {}
    onHide() {}
    onStateChanged(updates) {}

    // Utility methods
    showLoading(message = 'Loading...') {
        if (this.container) {
            const loader = document.createElement('div');
            loader.className = 'module-loader';
            loader.innerHTML = `
                <div class="spinner"></div>
                <div>${message}</div>
            `;
            this.container.appendChild(loader);
        }
    }

    hideLoading() {
        if (this.container) {
            const loader = this.container.querySelector('.module-loader');
            if (loader) loader.remove();
        }
    }

    showError(message) {
        if (this.container) {
            const error = document.createElement('div');
            error.className = 'module-error';
            error.innerHTML = `
                <div class="error-message">${message}</div>
                <button onclick="this.parentElement.remove()">×</button>
            `;
            this.container.appendChild(error);
        }
    }
}

window.DashboardModule = DashboardModule;
