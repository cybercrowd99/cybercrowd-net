// dashboard.js
// Core elastic dashboard controller: tier + state + wiring

import { enableDashboardDrag } from './dashboard-drag.js';
import { initDashboardDock } from './dashboard-dock.js';

const DASHBOARD_ID = 'dashboard';
const STORAGE_KEY = 'cybercrowd_dashboard_state';

function getDashboardEl() {
    return document.getElementById(DASHBOARD_ID);
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

function applyState(el, state) {
    if (!state) return;

    if (state.tier) {
        el.setAttribute('data-tier', state.tier);
    }
    if (state.collapsed != null) {
        el.setAttribute('data-state', state.collapsed ? 'collapsed' : 'expanded');
    }
    if (state.position && state.position.mode === 'free') {
        el.style.position = 'fixed';
        el.style.top = state.position.top;
        el.style.left = state.position.left;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
    }
    if (state.position && state.position.mode === 'dock') {
        el.style.position = 'fixed';
        el.style.bottom = '16px';
        el.style.right = '16px';
        el.style.top = 'auto';
        el.style.left = 'auto';
    }
}

function readStateFromDom(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    const mode =
        style.bottom === 'auto' && style.right === 'auto'
            ? 'free'
            : 'dock';

    return {
        tier: el.getAttribute('data-tier') || 'free',
        collapsed: el.getAttribute('data-state') === 'collapsed',
        position:
            mode === 'free'
                ? {
                      mode: 'free',
                      top: rect.top + 'px',
                      left: rect.left + 'px'
                  }
                : {
                      mode: 'dock'
                  }
    };
}

export function setDashboardTier(tier) {
    const el = getDashboardEl();
    if (!el) return;

    el.setAttribute('data-tier', tier);
    const state = readStateFromDom(el);
    state.tier = tier;
    saveState(state);
}

export function toggleDashboardCollapse() {
    const el = getDashboardEl();
    if (!el) return;

    const current = el.getAttribute('data-state') || 'expanded';
    const next = current === 'collapsed' ? 'expanded' : 'collapsed';
    el.setAttribute('data-state', next);

    const state = readStateFromDom(el);
    state.collapsed = next === 'collapsed';
    saveState(state);
}

export function initDashboard() {
    const el = getDashboardEl();
    if (!el) return;

    // restore state
    const saved = loadState();
    applyState(el, saved);

    // wire collapse toggle if header exists
    const header = el.querySelector('.header');
    if (header) {
        header.addEventListener('dblclick', () => {
            toggleDashboardCollapse();
        });
    }

    // drag + dock
    enableDashboardDrag(el, () => {
        const state = readStateFromDom(el);
        saveState(state);
    });

    initDashboardDock(el, () => {
        const state = readStateFromDom(el);
        saveState(state);
    });
}

// auto-init if present
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
