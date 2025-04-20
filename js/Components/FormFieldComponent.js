class FormFieldComponent {
    constructor(oData) {
        this.component = 'FormFieldComponent';
        this.field = oData.FormFieldComponent.field;
        this.label = oData.FormFieldComponent.label;
        this.type = oData.FormFieldComponent.type;
        this.options = oData.FormFieldComponent.options;
        this.required = oData.FormFieldComponent.required;
        this.disabled = oData.FormFieldComponent.disabled;
        this.value = oData.FormFieldComponent.value;
        this.renderLabel = oData.FormFieldComponent.renderLabel;
        this.element = null;
    }

    render() {
        const container = document.createElement('div');

        if (this.label && this.renderLabel) {
            const label = document.createElement('label');
            label.textContent = this.label;
            label.setAttribute('for', this.field);

            if (this.required) {
                label.classList.add('label-required');
            }

            container.appendChild(label);
        }

        if (this.type === 'list') {
            const select = document.createElement('select');
            select.id = this.field;
            select.name = this.field;
            select.disabled = this.disabled;

            Object.entries(this.options).forEach(([value, description]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = description;
                if (this.value == option.value) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            this.element = select;

            if (this.required) {
                select.required = true;
            }

            container.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = this.type;
            input.id = this.field;
            input.name = this.field;
            input.value = this.value;
            input.disabled = this.disabled;
            input.autocomplete = 'off';
            container.appendChild(input);

            if (this.required) {
                input.required = true;
            }
            this.element = input;
        }
        
        return container;
    }
}