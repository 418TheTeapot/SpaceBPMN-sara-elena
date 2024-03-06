import {
    getLabel
} from 'bpmn-js/lib/features/label-editing/LabelUtil';

import {
    is,
    getBusinessObject
} from '../../../../../Desktop/GP/Prototipo/SpaceBPMN-main/nostroSpace/example/lib/util/Util';




export function getConcreteType(element) {
    const { type: elementType } = element;

    let type = getRawType(elementType);

    // Verifica se il tipo è uno dei tipi "space"
    if (type.startsWith('space:')) {
        // Se il tipo inizia con "space:", restituisci il tipo così com'è
        return type;
    }

    // Altrimenti, continua con la tua logica esistente per gli altri tipi

    return type;
}


export const PanelHeaderProvider = {




};


// helpers ///////////////////////




function getRawType(type) {
    return type.split(':')[1];
}

function getEventDefinitionPrefix(eventDefinition) {
    const rawType = getRawType(eventDefinition.$type);

    return rawType.replace('EventDefinition', '');
}



