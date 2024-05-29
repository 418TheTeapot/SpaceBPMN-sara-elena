import {
    getLabel
} from 'bpmn-js/lib/features/label-editing/LabelUtil';

import {
    is,
    getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import PlaceEventIcon from '../icons/bpmn-icon-start-event-none.svg';
import TransitionEventIcon from '../icons/connection.svg';
import SpaceDiagramIcon from '../icons/space-icon.svg';
import SpaceIcon from '../icons/space-icon.svg';  // Assicurati che il percorso sia corretto

export function getConcreteType(element) {
    const { type: elementType } = element;
    let type = getRawType(elementType);
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
            elementType = '';
            elementName = getBusinessObject(element).name || '';
        } else if (is(element, 'space:Transition')) {
            elementType = '';
            elementName = getBusinessObject(element).name || '';
        } else {
            elementType = '';
            elementName = getLabel(element) || '';
        }

        return elementName ? `${elementName}` : elementType;
    },

    getElementIcon: (element) => {
        if (is(element, 'space:SpaceDiagram')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={SpaceDiagramIcon} />;
        }
        if (is(element, 'space:Transition')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={TransitionEventIcon} />;
        }
        if (is(element, 'space:Place')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={PlaceEventIcon} />;
        }
        if (is(element, 'space:Space')) {
            return () => <img class="bio-properties-panel-header-template-icon" width="32" height="32" src={SpaceIcon} />;
        }
    },

    getTypeLabel: (element) => {
        const label = getConcreteType(element);
        return label;
    }
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
