import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

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

    const { t: translate } = useTranslation();

    if (typeof debounce !== 'function') {
        console.error('debounce is not a function');
        return;
    }

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