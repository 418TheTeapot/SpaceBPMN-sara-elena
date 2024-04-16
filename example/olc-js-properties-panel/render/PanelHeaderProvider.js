import {
    getLabel
} from 'bpmn-js/lib/features/label-editing/LabelUtil';

import {
    is,
    getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';



import PlaceEventIcon from '../icons/bpmn-icon-start-event-none.svg';
import TransitionEventIcon from '../icons/got.svg';



export function getConcreteType(element) {
    const {
        type: elementType
    } = element;

    let type = getRawType(elementType);

    // (1) event definition types
    const eventDefinition = getEventDefinition(element);

    if (eventDefinition) {
        type = `${getEventDefinitionPrefix(eventDefinition)}${type}`;


        return type;
    }

    return type;
}

export const PanelHeaderProvider = {

    getDocumentationRef: (element) => {
        return null;
    },

    getElementLabel: (element) => {
        if (is(element, 'space:Place')) {
            return getBusinessObject(element).name || 'Place'; // Restituisce il nome del Place o un placeholder
        } else if (is(element, 'space:Transition')) {
            return getBusinessObject(element).name || 'Transition'; // Restituisce il nome della Transition o un placeholder
        }
        return getLabel(element) || 'Space_Diagram'; // Fallback per altri tipi
    },



    getElementIcon: (element) => {

        const config = {
            elementTemplateIconRenderer: (element) => {
                if (element.type === 'space:Place') {
                    return PlaceEventIcon;
                } else if (element.type === 'Space:Transition') {
                    return TransitionEventIcon;
                }
            }
        };

        if (is(element, 'space:Transition')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={ TransitionEventIcon } />;
        } else if (is(element, 'space:Place')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={ PlaceEventIcon } />;
        }
    },

    getTypeLabel: (element) => {

        return null;
    },

    //     const elementTemplates = getTemplatesService();
    //
    //     if (elementTemplates) {
    //         const template = getTemplate(element, elementTemplates);
    //
    //         if (template && template.name) {
    //             return template.name;
    //         }
    //     }
    //
    //     const concreteType = getConcreteType(element);
    //
    //     return concreteType
    //         .replace(/(\B[A-Z])/g, ' $1')
    //         .replace(/(\bNon Interrupting)/g, '($1)');
    // }

};

// helpers ///////////////////////



function getEventDefinition(element) {
    const businessObject = getBusinessObject(element),
        eventDefinitions = businessObject.eventDefinitions;

    return eventDefinitions && eventDefinitions[0];
}

function getRawType(type) {
    return type.split(':')[1];
}

function getEventDefinitionPrefix(eventDefinition) {
    const rawType = getRawType(eventDefinition.$type);

    return rawType.replace('EventDefinition', '');
}




