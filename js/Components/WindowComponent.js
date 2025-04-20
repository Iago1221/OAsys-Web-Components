class WindowComponent {
    constructor(components = []) {
        this.components = components;
        this.element;
        this.callbacks = {
            onClose: null,
            onFullscreen: null,
            onWindow: null
        };
    }

    addComponent(component) {
        this.components.push(component);
    }

    setTitle(sTitle) {
        this.sTitle = sTitle;
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    render(data = {}) {
        const windowElement = document.createElement('div');
        windowElement.classList.add('component');

        const header = document.createElement('div');
        header.classList.add('component-header');

        const title = document.createElement('span');
        title.classList.add('component-title');
        title.innerText = this.sTitle;
        header.appendChild(title);

        const actions = document.createElement('div');
        actions.classList.add('component-actions');

        const fullscreenButton = document.createElement('button');
        fullscreenButton.classList.add('fullscreen-button');
        fullscreenButton.title = 'Tela Cheia';
        fullscreenButton.innerHTML = '<i class="fi fi-tr-window-restore"></i>';
        actions.appendChild(fullscreenButton);

        const windowButton = document.createElement('button');
        windowButton.classList.add('window-button');
        windowButton.title = 'Janela';
        windowButton.style.display = 'none';
        windowButton.innerHTML = '<i class="fi fi-tr-window-maximize"></i>';
        actions.appendChild(windowButton);

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;';
        actions.appendChild(closeButton);

        header.appendChild(actions);
        windowElement.appendChild(header);

        const content = document.createElement('div');
        content.classList.add('component-content');

        this.components.forEach(component => {
            content.appendChild(component.render(data));
        });

        windowElement.appendChild(content);

        windowElement.style.width = 'auto';
        windowElement.style.height = 'auto';
        windowElement.style.position = 'absolute';
        windowElement.style.resize = 'both';

        this.centerWindow(windowElement);

        this.makeDraggable(windowElement);
        this.addFullscreenButtonListener(windowElement, fullscreenButton, windowButton);
        this.addComponentClickListener(windowElement);
        this.addCloseButtonListener(windowElement, closeButton);

        this.element = windowElement;
        return windowElement;
    }

    centerWindow(windowElement) {
        const workspace = App.getInstance().getWorkspace();
        const workspaceRect = workspace.getBoundingClientRect();
        const componentRect = windowElement.getBoundingClientRect();

        const centerX = ((workspaceRect.width - componentRect.width) / 2) * 0.7;
        const centerY = ((workspaceRect.height - componentRect.height) / 2) * 0.4;

        windowElement.style.left = `${centerX}px`;
        windowElement.style.top = `${centerY}px`;
    }

    addFullscreenButtonListener(windowElement, fullscreenButton, windowButton) {
        fullscreenButton.addEventListener('click', () => {
            windowElement.originalWidth = windowElement.style.width;
            windowElement.originalHeight = windowElement.style.height;
            windowElement.originalLeft = windowElement.style.left;
            windowElement.originalTop = windowElement.style.top;

            windowElement.style.width = '100%';
            windowElement.style.height = '100%';
            windowElement.style.left = '0';
            windowElement.style.top = '0';
            windowElement.style.resize = 'none';
            fullscreenButton.style.display = 'none';
            windowButton.style.display = 'block';

            if (this.callbacks.onFullscreen) {
                this.callbacks.onFullscreen(true);
            }
        });

        windowButton.addEventListener('click', () => {
            windowElement.style.width = windowElement.originalWidth || 'auto';
            windowElement.style.height = windowElement.originalHeight || 'auto';
            windowElement.style.left = windowElement.originalLeft || '50%';
            windowElement.style.top = windowElement.originalTop || '50%';
            windowElement.style.resize = 'both';
            fullscreenButton.style.display = 'block';
            windowButton.style.display = 'none';

            if (this.callbacks.onFullscreen) {
                this.callbacks.onFullscreen(false);
            }
        });
    }

    addComponentClickListener(windowElement) {
        windowElement.addEventListener('click', (e) => {
            if (windowElement !== App.getInstance().getActiveElement()) {
                if (e.target.classList.contains('close-button') ||
                    e.target.classList.contains('principal-form-button') ||
                    e.target.classList.contains('context-li') ||
                    e.target.classList.contains('action-button')
                ) {
                    return;
                }
                App.getInstance().setActiveElement(windowElement);
            }
        });
    }

    addCloseButtonListener(windowElement, closeButton) {
        closeButton.addEventListener('click', () => {
            const componentId = windowElement.getAttribute('data-id');
            const fatherId = windowElement.getAttribute('father-id');

            if (this.callbacks.onClose) {
                this.callbacks.onClose(this, componentId, fatherId);
            } else {
                windowElement.remove();
                document.querySelector(`.tab-bar-button[data-component="component${componentId}"]`)?.remove();
                if (fatherId && fatherId !== 'null') {
                    App.getInstance().openComponent(fatherId);
                }
            }
        });
    }

    makeDraggable(windowElement) {
        const header = windowElement.querySelector('.component-header');
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - windowElement.offsetLeft;
            offsetY = e.clientY - windowElement.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const workspace = App.getInstance().getWorkspace();
                const workspaceRect = workspace.getBoundingClientRect();
                const componentRect = windowElement.getBoundingClientRect();

                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                newLeft = Math.max(0, Math.min(newLeft, workspaceRect.width - componentRect.width));
                newTop = Math.max(0, Math.min(newTop, workspaceRect.height - componentRect.height));

                windowElement.style.left = `${newLeft}px`;
                windowElement.style.top = `${newTop}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    fromSuggest(suggest) {
        this.suggest = suggest;
    }

    verifySuggest() {
        const gridComponent = this.element.querySelector('.grid-container');
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
                this.suggest.handleGridSelection(this.element);
            });
        }

        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.suggest.closeGridWindow(this.element);
            }
        });

        this.suggest.modalOverlay.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.suggest.closeGridWindow(this.element);
            }
        });
    }
}