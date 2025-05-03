class SuggestFieldComponent {
    constructor(data) {
        this.component = 'SuggestFieldComponent';
        this.field = data.SuggestFieldComponent.field;
        this.route = data.SuggestFieldComponent.route;
        
        this.fieldName = data.SuggestFieldComponent.idField.field;
        this.descriptionFieldName = data.SuggestFieldComponent.descriptionField.field;

        if (data.SuggestFieldComponent.clone) {
            data.SuggestFieldComponent.idField.field = this.field  + '[' + data.SuggestFieldComponent.idField.field + ']';
            data.SuggestFieldComponent.descriptionField.field = this.field  + '[' + data.SuggestFieldComponent.descriptionField.field + ']';
        } else {
            data.SuggestFieldComponent.idField.field = this.field  + '/' + data.SuggestFieldComponent.idField.field;
            data.SuggestFieldComponent.descriptionField.field = this.field  + '/' + data.SuggestFieldComponent.descriptionField.field;    
        }
        
        this.idField = new FormFieldComponent(data.SuggestFieldComponent.idField);
        this.descriptionField = new FormFieldComponent(data.SuggestFieldComponent.descriptionField);
        this.label = data.SuggestFieldComponent.label;
        this.bDisabled = data.SuggestFieldComponent.disabled;

        if (this.bDisabled) {
            this.idField.disabled = true;
            this.descriptionField.disabled = true;
        }

        this.suggestionsContainer = null;
        this.suggestionsList = null;
        this.modalOverlay = null;
        this.callbacks = {
            onSelect: null,
            onFetch: null
        };
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    render() {
        const container = document.createElement('div');

        const label = document.createElement('label');
        label.textContent = this.label;

        if (this.idField.required) {
            label.classList.add('label-required');
        }

        label.setAttribute('for', this.idField.field);
        container.appendChild(label);

        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.flexDirection = 'row';

        const fieldContainer = document.createElement('div');
        fieldContainer.style.width = '20%';
        const fieldElement = this.idField.render();
        fieldContainer.appendChild(fieldElement);
        inputContainer.appendChild(fieldContainer);

        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.textContent = '🔍';
        searchButton.style.width = '40px';

        if (this.bDisabled) {
            searchButton.disabled = true;
        }

        inputContainer.appendChild(searchButton);

        const descriptionContainer = document.createElement('div');
        const descriptionElement = this.descriptionField.render();
        descriptionContainer.appendChild(descriptionElement);
        inputContainer.appendChild(descriptionContainer);

        container.appendChild(inputContainer);

        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.style.position = 'relative';
        descriptionContainer.appendChild(this.suggestionsContainer);

        this.suggestionsList = document.createElement('ul');
        this.suggestionsList.style.display = 'none';
        this.suggestionsList.style.position = 'absolute';
        this.suggestionsList.style.zIndex = '1000';
        this.suggestionsList.style.backgroundColor = '#fff';
        this.suggestionsList.style.border = '1px solid #ccc';
        this.suggestionsList.style.listStyle = 'none';
        this.suggestionsList.style.padding = '0';
        this.suggestionsList.style.margin = '0';
        this.suggestionsList.style.width = '100%';
        this.suggestionsList.style.maxHeight = '200px';
        this.suggestionsList.style.overflowY = 'auto';
        this.suggestionsContainer.appendChild(this.suggestionsList);

        this.setupEvents(fieldElement, descriptionElement, searchButton);

        return container;
    }

    setupEvents(fieldElement, descriptionElement, searchButton) {
        fieldElement.querySelector('input').addEventListener('blur', (e) => {
            const value = e.target.value;
            if (value) {
                this.fetchData(value);
                return;
            }

            this.idField.element.value = null;
            this.descriptionField.element.value = null;
        });

        descriptionElement.querySelector('input').addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length >= 4) {
                this.fetchSuggestions(value);
            } else {
                this.hideSuggestions();
            }
        });

        searchButton.addEventListener('click', () => {
            this.openGridSelection();
        });

        document.addEventListener('click', (e) => {
            if (!this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    createModalOverlay() {
        if (this.modalOverlay) {
            document.body.removeChild(this.modalOverlay);
        }

        this.modalOverlay = document.createElement('div');
        this.modalOverlay.style.position = 'fixed';
        this.modalOverlay.style.top = '0';
        this.modalOverlay.style.left = '0';
        this.modalOverlay.style.width = '100%';
        this.modalOverlay.style.height = '100%';
        this.modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.modalOverlay.style.zIndex = '998';
        this.modalOverlay.style.display = 'flex';
        this.modalOverlay.style.justifyContent = 'center';
        this.modalOverlay.style.alignItems = 'center';

        const workspace = document.getElementById('workspace');
        workspace.parentNode.insertBefore(this.modalOverlay, workspace);
    }

    openGridSelection() {
        this.createModalOverlay();

        App.getInstance().openRoute(`${this.route}_suggest_list`, 'GET', null, true)
            .then((windowComponent) => {
                windowComponent.on('onClose', this.closeWindowCallback.bind(this));
                const windowElement= windowComponent.element;
                if (windowElement) {
                    windowElement.style.zIndex = '999';
                    this.setupGridSelectionListener(windowElement);
                    App.getInstance().workspace.appendChild(windowElement);
                    App.getInstance().getComponent(`${this.route}_suggest_list`).fromSuggest(this);
                }
            });
    }

    closeWindowCallback(windowComponent, componentId, fatherId) {
        const windowElement = windowComponent.element;

        windowElement.remove();
        document.querySelector(`.tab-bar-button[data-component="component${componentId}"]`)?.remove();
        if (fatherId && fatherId !== 'null') {
            App.getInstance().openComponent(fatherId);
        }

        this.closeGridWindow(windowElement);
    }

    setupGridSelectionListener(gridWindow) {
        const gridComponent = gridWindow.querySelector('.grid-container');
        if (!gridComponent) return;

        const contextMenu = gridComponent.querySelector('#context-menu');
        if (contextMenu) {
            const items = contextMenu.querySelectorAll('li');
            const selectAction = Array.from(items).find(li =>
                li.textContent.trim() === 'Selecionar'
            );

            if (!selectAction) {
                return;
            }

            selectAction.addEventListener('click', (e) => {
                this.handleGridSelection(gridWindow);
            });
        }

        gridWindow.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeGridWindow(gridWindow);
            }
        });

        this.modalOverlay.addEventListener('click', (e) => {
            if (!gridWindow.contains(e.target)) {
                this.closeGridWindow(gridWindow);
            }
        });
    }

    removeModalOverlay() {
        const aElements = document.querySelectorAll(`.component[suggest-element="true"]`);
        aElements.forEach(oElement => {
            oElement.remove();
        });

        if (this.modalOverlay) {
            document.body.removeChild(this.modalOverlay);
            this.modalOverlay = null;
        }
    }

    handleGridSelection(gridWindow) {
        const rowId = gridWindow.querySelector('#context-menu').getAttribute('data-row-id');
        const row = gridWindow.querySelector(`tr[data-row-id="${rowId}"]`);
        if (!row) return;

        const fieldValue = row.querySelector(`td[data-field="${this.fieldName}"]`)?.textContent || '';
        const descriptionValue = row.querySelector(`td[data-field="${this.descriptionFieldName}"]`)?.textContent || '';

        this.idField.element.value = fieldValue;
        this.descriptionField.element.value = descriptionValue;

        if (this.callbacks.onSelect) {
            this.callbacks.onSelect({
                [this.fieldName]: fieldValue,
                [this.descriptionFieldName]: descriptionValue
            });
        }

        this.closeGridWindow(gridWindow);
    }

    closeGridWindow(gridWindow) {
        if (gridWindow) {
            gridWindow.remove();
        }

        this.removeModalOverlay();
    }

    fetchData(value) {
        fetch(`${App.getInstance().sUrl}?route=${this.route}_suggest_find`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: value
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data && data[this.fieldName] && data[this.descriptionFieldName]) {
                    this.idField.element.value = data[this.fieldName];
                    this.descriptionField.element.value = data[this.descriptionFieldName];

                    if (this.callbacks.onFetch) {
                        this.callbacks.onFetch(data);
                    }
                    return;
                }

                this.idField.element.value = null;
                this.descriptionField.element.value = null;
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    fetchSuggestions(value) {
        fetch(`${App.getInstance().sUrl}?route=${this.route}_suggest_get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: {[this.descriptionFieldName]: value}
            })
        })
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    this.showSuggestions(data);
                } else {
                    this.hideSuggestions();
                }
            })
            .catch(error => {
                console.error('Error fetching suggestions:', error);
                this.hideSuggestions();
            });
    }

    showSuggestions(items) {
        this.suggestionsList.innerHTML = '';

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item[this.descriptionFieldName];
            li.style.padding = '5px 10px';
            li.style.cursor = 'pointer';

            li.addEventListener('mouseover', () => {
                li.style.backgroundColor = '#f0f0f0';
            });

            li.addEventListener('mouseout', () => {
                li.style.backgroundColor = '';
            });

            li.addEventListener('click', () => {
                this.idField.element.value = item[this.fieldName];
                this.descriptionField.element.value = item[this.descriptionFieldName];
                this.hideSuggestions();

                if (this.callbacks.onSelect) {
                    this.callbacks.onSelect(item);
                }
            });

            this.suggestionsList.appendChild(li);
        });

        this.suggestionsList.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestionsList.style.display = 'none';
    }
}