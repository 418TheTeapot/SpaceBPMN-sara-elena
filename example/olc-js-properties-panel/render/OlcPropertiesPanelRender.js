import  OlcPropertiesPanel from "./OlcPropertiesPanel"
import {
    isUndo,
    isRedo
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';

import {
    render
} from '@bpmn-io/properties-panel/preact';

import {
    domify,
    query as domQuery,
    event as domEvent
} from 'min-dom';

const DEFAULT_PRIORITY = 1000;

export default class OlcPropertiesPanelRenderer {

    constructor(config, injector, eventBus) {
        const {
            parent,
            layout: layoutConfig,
            description: descriptionConfig,
                  } = config || {};

        this._eventBus = eventBus;
        this._injector = injector;
        this._layoutConfig = layoutConfig;
        this._descriptionConfig = descriptionConfig;

        this._container = domify(
            '<div style="height: 100%" class="bio-properties-panel-container"></div>'
        );

        var commandStack = injector.get('commandStack', false);

        commandStack && setupKeyboard(this._container, eventBus, commandStack);

        eventBus.on('diagram.init', () => {
            if (parent) {
                this.attachTo(parent);
            }
        });

        eventBus.on('diagram.destroy', () => {
            this.detach();
        });

        eventBus.on('root.added', (event) => {
            const { element } = event;

            this._render(element);
        });
    }

    attachTo(container) {
        if (!container) {
            throw new Error('container required');
        }

        // unwrap jQuery if provided
        if (container.get && container.constructor.prototype.jquery) {
            container = container.get(0);
        }

        if (typeof container === 'string') {
            container = domQuery(container);
        }

        // (1) detach from old parent
        this.detach();

        // (2) append to parent container
        container.appendChild(this._container);

        // (3) notify interested parties
        this._eventBus.fire('propertiesPanel.attach');
    }

    /**
     * Detach the properties panel from its parent node.
     */
    detach() {
        const parentNode = this._container.parentNode;

        if (parentNode) {
            parentNode.removeChild(this._container);

            this._eventBus.fire('propertiesPanel.detach');
        }
    }


    registerProvider(priority, provider) {

        if (!provider) {
            provider = priority;
            priority = DEFAULT_PRIORITY;
        }

        if (typeof provider.getGroups !== 'function') {
            console.error(
                'Properties provider does not implement #getGroups(element) API'
            );

            return;
        }

        this._eventBus.on('propertiesPanel.getProviders', priority, function(event) {
            event.providers.push(provider);
        });

        this._eventBus.fire('propertiesPanel.providersChanged');
    }

    /**
     * Updates the layout of the properties panel.
     * @param {Object} layout
     */
    setLayout(layout) {
        this._eventBus.fire('propertiesPanel.setLayout', { layout });
    }

    _getProviders() {
        const event = this._eventBus.createEvent({
            type: 'propertiesPanel.getProviders',
            providers: []
        });

        this._eventBus.fire(event);

        return event.providers;
    }

    _render(element) {
        const canvas = this._injector.get('canvas');

        if (!element) {
            element = canvas.getRootElement();
        }

        if (isImplicitRoot(element)) {
            return;
        }

        render(
            <OlcPropertiesPanel
                element={ element }
                injector={ this._injector }
                getProviders={ this._getProviders.bind(this) }
                layoutConfig={ this._layoutConfig }
                descriptionConfig={ this._descriptionConfig }

            />,
            this._container
        );

        this._eventBus.fire('propertiesPanel.rendered');
    }

    _destroy() {
        if (this._container) {
            render(null, this._container);

            this._eventBus.fire('propertiesPanel.destroyed');
        }
    }
}

OlcPropertiesPanelRenderer.$inject = [ 'config.propertiesPanel', 'injector', 'eventBus' ];


// helpers ///////////////////////

function isImplicitRoot(element) {

    // Backwards compatibility for diagram-js<7.4.0, see https://github.com/bpmn-io/bpmn-properties-panel/pull/102
    return element && (element.isImplicit || element.id === '__implicitroot');
}

function setupKeyboard(container, eventBus, commandStack) {

    function cancel(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function handleKeys(event) {

        if (isUndo(event)) {
            commandStack.undo();

            return cancel(event);
        }

        if (isRedo(event)) {
            commandStack.redo();

            return cancel(event);
        }
    }

    eventBus.on('keyboard.bind', function() {
        domEvent.bind(container, 'keydown', handleKeys);
    });

    eventBus.on('keyboard.unbind', function() {
        domEvent.unbind(container, 'keydown', handleKeys);
    });
}