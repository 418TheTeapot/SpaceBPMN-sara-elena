import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';

import {is} from "../../../lib/util/Util";
import {useService} from "../../hooks";

export function CustomPros(props) {
    const { element } = props;

    return [
        {
            id: 'description',
            component: Description,  // Componente per la descrizione
            isEdited: isTextAreaEntryEdited
        }
    ];
}

// Definizione del componente Description che funziona simile al componente Name
function Description(props) {
    const { element } = props;
    if (!element || !element.businessObject) {
        console.error('Element or businessObject is undefined');
        return null; // Ritorna null o un placeholder se l'elemento non è valido
    }

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    let options = {
        element,
        id: 'description',
        label: translate('Description'),
        debounce,
        setValue: (value) => {
            if (element && element.businessObject) {
                modeling.updateProperties(element, { description: value });
            }
        },
        getValue: () => {
            return element.businessObject ? element.businessObject.description || '' : '';
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}


