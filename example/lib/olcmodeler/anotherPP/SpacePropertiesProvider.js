export default function SpacePropertiesProvider(eventBus, olcFactory, elementRegistry, translate) {
    // Implementa qui la logica per gestire gli elementi 'space:'

    this.getTabs = function(element) {
        var tabs = [];

        if (element.type === 'space:CustomElementType') {
            // Aggiungi schede di proprietà per gli elementi 'space:CustomElementType'
            tabs.push({
                id: 'custom-properties',
                label: 'Custom Properties',
                groups: [
                    {
                        id: 'custom-group',
                        label: 'Custom Group',
                        entries: [] // Array di campi di input per le proprietà
                    }
                ]
            });
        }

        // Restituisce le schede delle proprietà
        return tabs;
    };
}

// Dipendenze necessarie per il provider
SpacePropertiesProvider.$inject = [
    'eventBus',
    'olcFactory',
    'elementRegistry',
    'translate'
];
