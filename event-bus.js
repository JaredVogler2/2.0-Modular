/**
 * Event Bus for module communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback, context) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push({ callback, context });
        return this;
    }

    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(
            listener => listener.callback !== callback
        );
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(listener => {
            listener.callback.apply(listener.context, args);
        });
        return this;
    }

    once(event, callback, context) {
        const onceWrapper = (...args) => {
            callback.apply(context, args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper, context);
    }
}

// Global event bus instance
window.DashboardEvents = new EventBus();

// Common events
const EVENTS = {
    // Data events
    SCENARIO_CHANGED: 'scenario:changed',
    DATA_LOADED: 'data:loaded',
    DATA_REFRESH: 'data:refresh',
    
    // View events
    VIEW_CHANGED: 'view:changed',
    MODULE_LOADED: 'module:loaded',
    MODULE_UNLOADED: 'module:unloaded',
    
    // Filter events
    TEAM_FILTER_CHANGED: 'filter:team:changed',
    PRODUCT_FILTER_CHANGED: 'filter:product:changed',
    DATE_FILTER_CHANGED: 'filter:date:changed',
    
    // Action events
    TASK_ASSIGNED: 'task:assigned',
    EXPORT_REQUESTED: 'export:requested',
    ASSIGNMENT_GENERATED: 'assignment:generated'
};

window.DASHBOARD_EVENTS = EVENTS;
