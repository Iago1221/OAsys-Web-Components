class GridComponent {
    constructor(aData) {
        this.columns = aData.GridComponent.columns;
        this.filters = aData.GridComponent.filters;
        this.actions = aData.GridComponent.actions;
        this.gridActions = aData.GridComponent.gridActions;
        this.rows = aData.GridComponent.rows;
        this.page = aData.GridComponent.pagination.page;
        this.total = aData.GridComponent.pagination.total;
        this.totalPages = aData.GridComponent.pagination.totalPages;
        this.route = aData.window.route;
        this.element = null;
    }

    render() {
        const gridElement = document.createElement('div');
        gridElement.classList.add('grid-container');

        // Filtros
        const filters = document.createElement('div');
        filters.classList.add('filters');

        this.filters.forEach(filter => {
            const filterElement = document.createElement('div');
            filterElement.classList.add('filter');

            const label = document.createElement('label');
            label.textContent = filter.label;
            filterElement.appendChild(label);

            if (filter.type === 'list') {
                const select = document.createElement('select');
                select.id = filter.field;
                select.name = filter.field;
                filter.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.description;

                    if (filter.value === optionElement.value) {
                        optionElement.selected = true;
                    }

                    select.appendChild(optionElement);
                });
                filterElement.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = filter.type;
                input.id = filter.field;
                input.name = filter.field;
                input.placeholder = `Filtrar por ${filter.label}`;
                input.value = filter.value ?? null;

                filterElement.appendChild(input);
            }

            filters.appendChild(filterElement);
        });

        const applyFiltersButton = document.createElement('button');
        applyFiltersButton.id = 'apply-filters';
        applyFiltersButton.textContent = 'Aplicar Filtros';
        applyFiltersButton.onclick = this.applyFilters.bind(this);
        filters.appendChild(applyFiltersButton);

        gridElement.appendChild(filters);

        // Ações do grid
        const actions = document.createElement('div');
        actions.classList.add('actions');

        this.gridActions.forEach(action => {
            const actionButton = document.createElement('button');
            actionButton.classList.add('action-button');
            actionButton.textContent = action.label;
            actionButton.onclick = () => App.getInstance().openRoute(action.route, action.httpMethod, this.route);
            actions.appendChild(actionButton);
        });

        gridElement.appendChild(actions);

        // Tabela
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        this.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        this.rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-row-id', row.iId);

            this.columns.forEach(column => {
                const td = document.createElement('td');
                td.setAttribute('data-field', column.field)
                td.textContent = row[column.field];

                if (column.field.includes('\/')) {
                    let aParts = column.field.split('\/');
                    if (row[aParts[0]]) {
                        td.textContent = row[aParts[0]][aParts[1]];
                    }
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        gridElement.appendChild(table);

        // Rodapé do grid
        const footer = document.createElement('div');
        footer.classList.add('grid-footer');

        const pagination = document.createElement('div');
        pagination.classList.add('pagination');

        const prevButton = document.createElement('button');
        prevButton.id = 'prev-page';
        prevButton.textContent = 'Anterior';
        prevButton.onclick = this.changePage.bind(this, -1);

        if (this.page <= 1) {
            prevButton.disabled = true;
        }

        pagination.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.classList.add('page-info');
        pageInfo.textContent = `Página ${this.page} de ${this.totalPages}`;
        pagination.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.id = 'next-page';
        nextButton.textContent = 'Próxima';
        nextButton.onclick = this.changePage.bind(this, 1);
        pagination.appendChild(nextButton);

        if (this.page >= this.totalPages) {
            nextButton.disabled = true;
        }

        footer.appendChild(pagination);

        const recordCount = document.createElement('div');
        recordCount.classList.add('record-count');
        recordCount.textContent = `Total: ${this.total} registros`;
        footer.appendChild(recordCount);

        gridElement.appendChild(footer);

        const contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';
        contextMenu.classList.add('context-menu');

        const contextMenuList = document.createElement('ul');

        this.actions.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action.label;
            li.classList.add('context-li');
            li.onclick = this.handleContextAction.bind(this, action.route, action.label, action.httpMethod);
            contextMenuList.appendChild(li);
        });

        contextMenu.appendChild(contextMenuList);
        gridElement.appendChild(contextMenu);
        this.element = gridElement;

        this.addComponentClickListener();

        return gridElement;
    }

    async handleContextAction(route, name, httpMethod) {
        if (!route) {
            return;
        }

        const rowId = this.element.querySelector('#context-menu').getAttribute('data-row-id');
        let url = `${App.getInstance().sUrl}?route=${route}`;
        const oEnvio = {method: httpMethod};

        if (httpMethod == 'GET') {
            if (App.getInstance().openComponent(route)) {
                return;
            }

            url += `&id=${rowId}`;
        } else {
            oEnvio.body = JSON.stringify({iId: rowId});
        }

        App.getInstance().showLoading();
        try {
            const response = await fetch(url, oEnvio);

            if (!response.ok) {
                if (response.status === 401) {
                    location.reload();
                } else {
                    const errorText = await response.text();
                    App.getInstance().openModal(errorText, 'error');
                }
                return;
            }

            if (httpMethod == 'GET') {
                const data = await response.json();
                App.getInstance().renderComponent(data, true, this.route);
            } else {
                this.applyFilters();
            }
        } catch (error) {
            console.error('Erro de rede ou requisição falhou:', error);
            App.getInstance().openModal('Erro de rede ou requisição falhou', 'error');
        } finally {
            App.getInstance().hideLoading();
        }
    }

    addComponentClickListener() {
        const contextMenu = this.element.querySelector('#context-menu');
        const rows = this.element.querySelectorAll('tbody tr');

        if (contextMenu && rows) {
            document.addEventListener('click', () => {
                contextMenu.style.display = 'none';
            })

            rows.forEach(row => {
                row.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    let topFather = isNaN(parseInt(App.getInstance().getActiveElement().style.top)) ? 0 : parseInt(App.getInstance().getActiveElement().style.top);
                    let leftFather = isNaN(parseInt(App.getInstance().getActiveElement().style.left)) ? 0 : parseInt(App.getInstance().getActiveElement().style.left);
                    let top = e.clientY - parseInt(topFather) - 50;
                    let left = e.clientX - leftFather;

                    contextMenu.style.display = 'block';
                    contextMenu.style.top = `${top}px`;
                    contextMenu.style.left = `${left}px`;

                    contextMenu.setAttribute('data-row-id', row.getAttribute('data-row-id'));
                });
            });
        }
    }

    applyFilters() {
        const filters = this.getFiltersFromElement();
        this.updateRecords(this.route, filters, this.page);
    }

    getFiltersFromElement() {
        const filters = {};
        const filtersDiv = this.element.querySelector('.filters');
        const inputs = filtersDiv.querySelectorAll('input');
        const selects = filtersDiv.querySelectorAll('select');

        inputs.forEach(input => {
            if (input.value) {
                filters[input.name] = input.value;
            }
        });

        selects.forEach(select => {
            if (select.value) {
                filters[select.name] = select.value;
            }
        });

        return filters;
    }

    async updateRecords(route, filters, page) {
        App.getInstance().showLoading();
        try {
            const response = await fetch(`${App.getInstance().sUrl}?route=${route}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filters: filters,
                    page: page,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    location.reload();
                } else {
                    const errorText = await response.text();
                    App.getInstance().openModal(errorText, 'error');
                }
                return;
            }

            const data = await response.json();

            this.element.remove();
            const oWindow = App.getInstance().getWindow(this.route);
            oWindow.querySelector('.component-content').appendChild(App.getInstance().renderComponent(data, false));
            App.getInstance().getComponent(this.route).verifySuggest();
        } catch (error) {
            console.error('Erro de rede ou requisição falhou:', error);
            App.getInstance().openModal('Erro de rede ou requisição falhou', 'error');
        } finally {
            App.getInstance().hideLoading();
            delete this;
        }
    }

    changePage(delta) {
        this.page = + delta;
        this.applyFilters();
    }
}