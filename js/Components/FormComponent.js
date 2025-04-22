class FormComponent {
    constructor(aData) {
        this.component = 'FormComponent';
        this.components = aData.FormComponent.components;
        this.layout = aData.FormComponent.layout;
        this.bDisabled = aData.FormComponent.disabled;
        this.route = aData.window.route;
        this.element = null;
        this.callbacks = {
            onSubmit: null,
            onSuccess: null,
            onError: null
        };
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    render() {
        const formElement = document.createElement('div');
        formElement.classList.add('form-container');

        const form = document.createElement('form');
        form.onsubmit = (e) => this.postForm(e, this.route);
        form.method = 'POST';
        form.noValidate = true;

        const fieldset = document.createElement('fieldset');
        fieldset.classList.add(this.layout);

        this.components.forEach(component => {
            fieldset.appendChild(App.getInstance().renderComponent(JSON.parse(component), false));
        });

        form.appendChild(fieldset);

        if (!this.bDisabled) {
            const submitButton = document.createElement('button');
            submitButton.classList.add('principal-form-button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Salvar';
            form.appendChild(submitButton);
        }

        formElement.appendChild(form);

        this.element = formElement;
        return formElement;
    }

    async postForm(event, route) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData();
        let sObrigatoriosNaoPreenchidos = '';

        const inputs = form.querySelectorAll('[name]');

        inputs.forEach(input => {
            const name = input.name;
            const label = document.querySelector(`label[for="${name}"]`);
            const sText = (label && label.textContent) || name;

            if (input.hasAttribute('required') && !input.value) {
                sObrigatoriosNaoPreenchidos += `O campo ${sText} é obrigatório <br>`;
            }

            if (input.type === 'file') {
                const files = input.files;
                if (files.length > 0) {
                    formData.append(name, files[0]);
                }
            } else {
                if (name.includes('/')) {
                    const [parentKey, childKey] = name.split('/');
                    formData.append(`${parentKey}[${childKey}]`, input.value);
                } else {
                    // Aqui está o segredo: `append` permite múltiplos campos com mesmo nome
                    formData.append(name, input.value);
                }
            }
        });

        if (sObrigatoriosNaoPreenchidos) {
            App.getInstance().openModal(sObrigatoriosNaoPreenchidos, 'error');
            return;
        }

        if (this.callbacks.onSubmit) {
            this.callbacks.onSubmit(formData);
        } else {
            if (await this.sendForm(formData, route)) {
                if (this.callbacks.onSuccess) {
                    this.callbacks.onSuccess();
                } else {
                    const father = App.getInstance().getActiveElement().getAttribute('father-id');
                    document.querySelector(`.tab-bar-button[data-component="component${this.route}"]`)?.remove();
                    if (father) {
                        App.getInstance().openComponent(father);
                        if (father.includes('list')) {
                            App.getInstance().getActiveElement().querySelector('#apply-filters')?.click();
                        }
                    }
                    App.getInstance().removeComponent(this.route);
                }
            } else if (this.callbacks.onError) {
                this.callbacks.onError();
            }
        }
    }

    async sendForm(formData, route) {
        App.getInstance().showLoading();
        let success = false;

        try {
            const response = await fetch(`${App.getInstance().sUrl}?route=${route}`, {
                method: 'POST',
                body: formData // sem header manual aqui!
            });

            if (!response.ok) {
                const errorText = await response.text();
                App.getInstance().openModal(errorText, 'error');
                return false;
            }

            success = true;
        } catch (error) {
            console.error('Erro de rede ou requisição falhou:', error);
            App.getInstance().openModal('Erro de rede ou requisição falhou', 'error');
        } finally {
            App.getInstance().hideLoading();
        }

        return success;
    }
}