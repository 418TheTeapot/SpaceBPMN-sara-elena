
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';


import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';
import {useService} from "../../hooks";



export function NameProps(props) {
    const {
        element
    } = props;

    if (isAny(element, [ 'bpmn:Collaboration', 'bpmn:DataAssociation', 'bpmn:Association' ])) {
        return [];
    }

    return [
        {
            id: 'name',
            component: NameProps,
            isEdited: isTextAreaEntryEdited
        }
    ];
}

function CustomNameEntry(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const debounce = useService('debounceInput');
    const translate = useService('translate');

    // Definisci le opzioni per l'entry del nome personalizzato
    const options = {
        element,
        id: 'name',
        label: translate('Name'),
        debounce,
        setValue: (value) => {
            modeling.updateProperties(element, {
                name: value
            });
        },
        getValue: (element) => {
            return element.businessObject.name;
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}



