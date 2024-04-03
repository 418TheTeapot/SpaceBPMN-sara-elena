import {
    getLabel
} from 'bpmn-js/lib/features/label-editing/LabelUtil';

import {
    is,
    getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
    isExpanded,
    isEventSubProcess,
    isInterrupting
} from 'bpmn-js/lib/util/DiUtil';




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
        if (is(element, 'bpmn:Process')) {
            return getBusinessObject(element).name;
        }

        return getLabel(element);
    },

    getElementIcon: (element) => {
        return null;
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

function isCancelActivity(element) {
    const businessObject = getBusinessObject(element);

    return businessObject && businessObject.cancelActivity !== false;
}

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





// function getTemplatesService() {
//
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     return useService('elementTemplates', false);
// }

function getTemplate(element, elementTemplates) {
    return elementTemplates.get(element);
}

function getTemplateDocumentation(element, elementTemplates) {
    const template = getTemplate(element, elementTemplates);

    return template && template.documentationRef;
}