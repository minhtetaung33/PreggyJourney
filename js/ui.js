// --- DOM Element Selection ---
const tabs = document.querySelectorAll('[role="tab"]');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');
const loadingOverlays = document.querySelectorAll('.loading-overlay');

/**
 * Shows a loading spinner overlay on a specific element.
 * @param {HTMLElement} element - The container element to show the loader in.
 */
export function showLoader(element) {
    const loader = element.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

/**
 * Hides a loading spinner overlay from a specific element.
 * @param {HTMLElement} element - The container element to hide the loader from.
 */
export function hideLoader(element) {
    const loader = element.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.add('hidden');
    }
}

/**
 * Initializes the tab switching functionality for the main navigation.
 */
export function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and hide all panels
            tabs.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('bg-indigo-100', 'text-indigo-700');
                t.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-100');
            });
            tabPanels.forEach(p => {
                p.classList.add('hidden');
            });

            // Activate the clicked tab
            tab.setAttribute('aria-selected', 'true');
            tab.classList.add('bg-indigo-100', 'text-indigo-700');
            tab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-100');

            // Show the corresponding tab panel
            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.remove('hidden');
            }
        });
    });

    // Set the first tab as active by default
    if (tabs.length > 0) {
        tabs[0].click();
    }
}