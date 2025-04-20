class TabComponent {
    constructor(oData) {
        this.title = oData.TabComponent.title || '';
        this.tabs = oData.TabComponent.tabs.map(tab => ({
            title: tab.title,
            layout: tab.layout || 'form-two-columns',
            components: tab.components.map(component =>
                new (App.getInstance().getCallableComponent(component.component))(component)
            )
        }));
        this.activeTabIndex = 0;
    }

    render() {
        const container = document.createElement('div');
        container.classList.add('tabs-container');

        if (this.title) {
            const titleElement = document.createElement('h3');
            titleElement.textContent = this.title;
            container.appendChild(titleElement);
        }

        // Cabeçalho das abas
        const tabsHeader = document.createElement('div');
        tabsHeader.classList.add('tabs-header');

        this.tabs.forEach((tab, index) => {
            const tabButton = document.createElement('button');
            tabButton.textContent = tab.title;
            tabButton.classList.add('tab-button');
            if (index === this.activeTabIndex) {
                tabButton.classList.add('active');
            }

            tabButton.addEventListener('click', () => this.setActiveTab(index));
            tabsHeader.appendChild(tabButton);
        });
        container.appendChild(tabsHeader);

        // Conteúdo das abas
        const tabsContent = document.createElement('div');
        tabsContent.classList.add('tabs-content');

        this.tabs.forEach((tab, index) => {
            const tabPanel = document.createElement('div');
            tabPanel.classList.add('tab-panel', tab.layout);
            if (index !== this.activeTabIndex) {
                tabPanel.style.display = 'none';
            }

            tab.components.forEach(component => {
                tabPanel.appendChild(component.render());
            });

            tabsContent.appendChild(tabPanel);
        });
        container.appendChild(tabsContent);

        return container;
    }

    setActiveTab(index) {
        event.preventDefault();
        if (index < 0 || index >= this.tabs.length) return;

        this.activeTabIndex = index;
        const container = this.getContainer();
        if (!container) return;

        // Atualiza botões ativos
        container.querySelectorAll('.tab-button').forEach((button, i) => {
            button.classList.toggle('active', i === index);
        });

        // Atualiza painéis visíveis
        container.querySelectorAll('.tab-panel').forEach((panel, i) => {
            panel.style.display = i === index ? 'grid' : 'none';
        });
    }

    getContainer() {
        return document.querySelector('.tabs-container');
    }
}