class FieldsetComponent {
    constructor(oData) {
        this.title = oData.FieldsetComponent.title;
        this.layout = oData.FieldsetComponent.layout;
        this.components = oData.FieldsetComponent.components.map(component => new (App.getInstance().getCallableComponent(component.component))(component));
    }

    render() {
        const fieldset = document.createElement('fieldset');
        fieldset.classList.add(this.layout);

        const legend = document.createElement('legend');
        legend.textContent = this.title;
        fieldset.appendChild(legend);

        this.components.forEach(component => {
            fieldset.appendChild(component.render());
        });

        return fieldset;
    }
}