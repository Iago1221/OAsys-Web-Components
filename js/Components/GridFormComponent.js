class GridFormComponent {
    constructor(oData) {
        this.title = oData.GridFormComponent.title;
        this.layout = oData.GridFormComponent.layout || 'form-two-columns';
        this.fields = oData.GridFormComponent.fields.map(field =>
            new (App.getInstance().getCallableComponent(field.component))(field)
        );
        this.rows = oData.GridFormComponent.rows || 1;
        this.maxRows = oData.GridFormComponent.maxRows || 10;
    }

    render() {
        const container = document.createElement('div');
        container.classList.add('grid-form-container');

        // Barra de título
        const header = document.createElement('div');
        header.classList.add('grid-form-header');

        if (this.title) {
            const titleElement = document.createElement('h3');
            titleElement.classList.add('grid-form-title');
            titleElement.textContent = this.title;
            header.appendChild(titleElement);
        }
        container.appendChild(header);

        // Container das linhas com scroll
        const rowsContainer = document.createElement('div');
        rowsContainer.classList.add('grid-form-rows-container');
        container.appendChild(rowsContainer);

        // Renderizar linhas iniciais
        this.renderRows(rowsContainer);

        return container;
    }

    renderRows(container) {
        container.innerHTML = '';

        for (let i = 0; i < this.rows; i++) {
            const row = document.createElement('div');
            row.classList.add('grid-form-row');
            row.dataset.rowIndex = i;

            // Campos
            this.fields.forEach(originalField => {
                const fieldContainer = document.createElement('div');
                fieldContainer.classList.add('grid-form-field');

                // Clonagem correta do campo
                const fieldData = this.cloneFieldData(originalField, i);
                const fieldClone = new (App.getInstance().getCallableComponent(fieldData.component))(fieldData);

                fieldContainer.appendChild(fieldClone.render());
                row.appendChild(fieldContainer);
            });

            const controls = document.createElement('div');
            controls.classList.add('grid-form-row-controls');

            if (this.rows < this.maxRows) {
                const addBtn = document.createElement('button');
                addBtn.textContent = '+';
                addBtn.classList.add('grid-form-add-btn');
                addBtn.title = 'Adicionar linha abaixo';
                addBtn.addEventListener('click', () => this.addRowAtPosition(i + 1, container));
                controls.appendChild(addBtn);
            }

            if (this.rows > 1) {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '-';
                removeBtn.classList.add('grid-form-remove-btn');
                removeBtn.title = 'Remover esta linha';
                removeBtn.addEventListener('click', () => this.removeRow(i, container));
                controls.appendChild(removeBtn);
            }

            row.appendChild(controls);
            container.appendChild(row);
        }
    }

    cloneFieldData(originalField, rowIndex) {
        // Cria uma cópia profunda dos dados do campo
        const clonedData = JSON.parse(JSON.stringify(originalField));
        clonedData.field = `${clonedData.field}[${rowIndex}]`;

        return {component: clonedData.component, [clonedData.component]: clonedData};
    }

    addRow(container) {
        if (this.rows >= this.maxRows) return;

        this.rows++;
        this.renderRows(container);

        // Atualiza controles se atingir o máximo
        if (this.rows >= this.maxRows) {
            const addButton = container.parentElement.querySelector('.grid-add-row');
            if (addButton) addButton.remove();
        }
    }

    removeRow(index, container) {
        if (this.rows <= 1) return;

        this.rows--;
        this.renderRows(container);

        // Restaura controles se estava no máximo
        if (this.rows < this.maxRows) {
            const controls = container.parentElement.querySelector('.grid-controls');
            if (controls && !controls.querySelector('.grid-add-row')) {
                const addButton = document.createElement('button');
                addButton.textContent = '+';
                addButton.classList.add('grid-add-row');
                addButton.addEventListener('click', () => this.addRow(container));
                controls.appendChild(addButton);
            }
        }
    }

    addRowAtPosition(position, container) {
        if (this.rows >= this.maxRows) return;

        this.rows++;
        this.renderRows(container);
    }
}