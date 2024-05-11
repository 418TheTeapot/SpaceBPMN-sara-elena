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

export const OlcPanelHeaderProvider = {

    getDocumentationRef: (element) => {
        return null;
    },

    getElementLabel: (element) => {
        let elementType = '';
        let elementName = '';

        if (is(element, 'space:Place')) {
            elementType = 'Place';
            elementName = getBusinessObject(element).name || 'Unnamed';
        } else if (is(element, 'space:Transition')) {
            elementType = 'Transition';
            elementName = getBusinessObject(element).name || 'Unnamed';
        } else {
            elementType = 'Space_Diagram';
            elementName = getLabel(element) || 'Unnamed';
        }

        return `${elementType}: ${elementName}`;
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




