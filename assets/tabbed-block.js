/**
 * Keyboard navigation for tabbed-block reference from https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/
 */

if (!customElements.get('tabbed-block')) {
  customElements.define(
    'tabbed-block',
    class TabbedBlock extends HTMLElement {
      constructor() {
        super();
        this.selectedValue = null;
        this.tabs = [];
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleTabKeydown = this.handleTabKeydown.bind(this);
      }

      connectedCallback() {
        this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));

        // Add event listeners and set default attributes
        this.tabs.forEach((tab) => {
          tab.addEventListener('click', this.handleTabClick);
          tab.addEventListener('keydown', this.handleTabKeydown);

          this.setDefaultAttributes(tab);
        });

        this.selectTab(this.tabs[0]);
      }

      setDefaultAttributes(tab) {
        const panelId = tab.dataset.value;
        if (!panelId) {
          return;
        }

        // Set tab attributes
        tab.setAttribute('id', `tab_${panelId}`);
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');

        // Set panel attributes
        const panel = this.getPanel(tab);
        if (!panel) {
          return;
        }

        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.classList.add('hidden');
      }

      selectTab(tab) {
        this.selectedValue = tab.dataset.value;
        this.showTab(tab);
      }

      handleTabClick(event) {
        const currentTab = this.getCurrentTab();
        const nextTab = event.currentTarget;

        if (currentTab === nextTab) {
          return;
        }

        this.hideTab(currentTab);
        this.selectTab(nextTab);
      }

      handleTabKeydown(event) {
        switch (event.key) {
          case 'ArrowLeft':
          case 'Left':
            this.moveFocusToPreviousTab(event.currentTarget);
            event.preventDefault();
            break;
          case 'ArrowRight':
          case 'Right':
            this.moveFocusToNextTab(event.currentTarget);
            event.preventDefault();
            break;
        }
      }

      moveFocusToPreviousTab(currentTab) {
        const currentIndex = this.tabs.indexOf(currentTab);
        if (currentIndex === 0) {
          return;
        }
        const previousTabItem = this.tabs[currentIndex - 1];
        if (!previousTabItem) {
          return;
        }

        return this.moveFocusToTab(previousTabItem);
      }

      moveFocusToNextTab(currentTab) {
        const currentIndex = this.tabs.indexOf(currentTab);
        if (currentIndex === this.tabs.length - 1) {
          return;
        }
        const nextTabItem = this.tabs[currentIndex + 1];
        if (!nextTabItem) {
          return;
        }

        return this.moveFocusToTab(nextTabItem);
      }

      moveFocusToTab(tab) {
        tab.focus();
      }

      showTab(tab) {
        this.highlighTab(tab);
        this.showPanel(tab);
      }

      hideTab(tab) {
        this.unhighlightTab(tab);
        this.hidePanel(tab);
      }

      showPanel(tab) {
        const panel = this.getPanel(tab);
        return panel.classList.remove('hidden');
      }

      hidePanel(tab) {
        const panel = this.getPanel(tab);
        panel.classList.add('hidden');
      }

      getPanel(tab) {
        const panelSelector = `#${tab.dataset.value}`;

        return this.querySelector(panelSelector);
      }

      unhighlightTab(tab) {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('data-state', 'inactive');
        tab.setAttribute('tabindex', '-1');
      }

      highlighTab(tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('data-state', 'active');
        tab.setAttribute('tabindex', '0');
      }

      getCurrentTab() {
        return this.querySelector(`[data-value=${this.selectedValue}]`);
      }
    },
  );
}
