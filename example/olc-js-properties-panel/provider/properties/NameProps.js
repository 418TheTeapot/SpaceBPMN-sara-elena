import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";
import {useService} from "bpmn-js-properties-panel";

export function NameProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'name',
            component: Name,
            isEdited: isTextAreaEntryEdited
        }
    ];
}

function Name(props) {
    const { element } = props;

    const translate = useService('translate');

    if (typeof translate !== 'function') {
        console.error('Translate service is not a function');
        return;
    }

    // Define the options for the custom name entry
    const options = {
        element,
        id: 'name',
        label: translate('Name'),
        debounce,
        setValue: (value) => {
            OlcModeling.updateLabel(element,{
                name: value
            });
        },
        getValue: (element) => {
            return element.businessObject.type;
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}