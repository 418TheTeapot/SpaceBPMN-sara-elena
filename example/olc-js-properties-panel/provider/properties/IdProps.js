import {isTextFieldEntryEdited, TextAreaEntry, TextFieldEntry} from "@bpmn-io/properties-panel";
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
export function IdProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'id',
           component: Id,
           isEdited: isTextFieldEntryEdited

        }
    ];
}

function Id(props) {
    const { element } = props;
    const { t: translate } = useTranslation();

    if (typeof translate !== 'function') {
        console.error('Translate service is not a function');
        return;
    }
    if (typeof debounce !== 'function') {
        console.error('debounce is not a function');
        return;
    }
    const options = {
        element,
        id: 'id',
        label: translate('Id'),
        debounce,
        setValue: (value) => {
            OlcModeling.updateLabel(element,{
                name: value
            });
        },
        getValue: (element) => {
            return element.businessObject.id;
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}