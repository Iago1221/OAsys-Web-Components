class App {
    static instance;

    constructor() {
        this.workspace = document.getElementById('workspace');
        this.tabs = document.getElementById('tabs-bar');
        this.activeElement = null;
        this.components = new Map(); // Armazena todos os componentes abertos
        this.registerComponents();
        this.sUrl = null;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new App();
        }
        return this.instance;
    }

    registerComponents() {
        this.componentRegistry = {
            GridComponent: GridComponent,
            WindowComponent: WindowComponent,
            FormComponent: FormComponent,
            FieldsetComponent: FieldsetComponent,
            FormFieldComponent: FormFieldComponent,
            GridFieldComponent: GridFieldComponent,
            SuggestFieldComponent: SuggestFieldComponent,
            TabComponent: TabComponent,
            GridFormComponent: GridFormComponent
        };
    }

    // Adiciona um componente ao gerenciamento
    addComponent(componentId, componentInstance) {
        this.components.set(componentId, componentInstance);
    }

    // Obtém um componente pelo ID
    getComponent(componentId) {
        return this.components.get(componentId);
    }

    // Remove um componente do gerenciamento
    removeComponent(componentId) {
        this.getComponent(componentId).element.remove();
        this.components.delete(componentId);
    }

    getWindow(route) {
        return this.workspace.querySelector(`.component[data-id="${route}"]`);
    }

    getWorkspace() {
        return this.workspace;
    }

    getActiveElement() {
        return this.activeElement;
    }

    getCallableComponent($sComponent) {
        return this.componentRegistry[$sComponent];
    }

    setActiveElement(element) {
        if (element?.getAttribute('suggest-element')) {
            return;
        }

        if (this.getActiveElement()) {
            this.getActiveElement().classList.add('inactive');
        }

        element?.classList.remove('inactive');
        this.activeElement = element;
    }

    closeModal() {
        const oModal = document.querySelector('.modal');
        oModal?.classList.remove('show');
    }

    openModal(message, type = 'info') {
        const modal = document.querySelector('.modal');
        const modalMessage = document.querySelector('.modal-message');
        modalMessage.innerHTML = message;
        modal.classList.remove('success', 'error');
        modal.classList.add(type);
        modal.classList.add('show');
    }

    async logout() {
        await this.openRoute('sys_logout');
        location.reload();
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    async openRoute(route, httpMethod = 'GET', fatherId = null, fromSuggest = false) {
        if (!fromSuggest && this.openComponent(route)) {
            return;
        }

        this.showLoading();
        try {
            const response = await fetch(`${this.sUrl}?route=${route}`, {
                method: httpMethod,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    location.reload();
                } else {
                    const errorText = await response.text();
                    this.openModal(errorText, 'error');
                }
                return;
            }

            const data = await response.json();

            if (fromSuggest) {
                let component = this.renderComponent(data, true, fatherId, true);
                component.element.setAttribute('suggest-element', true);
                return component;
            } else {
                this.renderComponent(data, true, fatherId);
            }
        } catch (error) {
            console.error('Erro de rede ou requisição falhou:', error);
            this.openModal('Erro de rede ou requisição falhou', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderComponent(data, newWindow = true, fatherId = null, returnWindow = false) {
        const sClass = data.component;
        const componentId = data.window?.route;

        if (this.getCallableComponent(sClass)) {
            const component = new (this.getCallableComponent(sClass))(data);


            if (newWindow) {
                const windowComponent = new WindowComponent([component]);
                windowComponent.setTitle(data.window?.title || '');
                const windowElement = windowComponent.render();
                windowElement.setAttribute('data-id', componentId);

                if (fatherId) {
                    windowElement.setAttribute('father-id', fatherId);
                }

                let oFather = document.querySelector(`.component[data-id="${fatherId}"]`);
                if (oFather && oFather.getAttribute('suggest-element')){
                    windowElement.setAttribute('suggest-element', true);
                    windowElement.style.zIndex = '999';

                    if (componentId) {
                        this.addComponent(componentId, windowComponent);
                    }

                    if (returnWindow) {
                        return windowComponent;
                    }

                    this.workspace.appendChild(windowElement);
                    return;
                }

                // Adiciona o componente ao gerenciamento
                if (componentId) {
                    this.addComponent(componentId, windowComponent);
                }

                if (returnWindow) {
                    return windowComponent;
                }
                this.workspace.appendChild(windowElement);
                this.createTabButton(componentId, data.window?.title || '');
                this.setActiveElement(windowElement);
            } else {
                return component.render();
            }
        } else {
            console.error(`Classe "${sClass}" não encontrada no registro.`);
        }
    }

    createTabButton(componentId, name) {
        const button = document.createElement('button');
        button.classList.add('tab-bar-button');
        button.setAttribute('data-component', `component${componentId}`);
        button.innerText = name;
        button.addEventListener('click', () => this.openComponent(componentId));
        this.tabs.appendChild(button);
    }

    openComponent(componentId) {
        const component = this.workspace.querySelector(`.component[data-id="${componentId}"]`);

        if (componentId && !component) {
            return false;
        }

        this.setActiveElement(component);
        return true;
    }
}