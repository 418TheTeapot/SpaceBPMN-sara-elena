import {TextFieldEntry, isTextFieldEntryEdited, SelectEntry} from '@bpmn-io/properties-panel';
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";

export function LuxProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'lux',
            component: Lux,
            isEdited: isTextFieldEntryEdited

        }
    ];
}

function Lux(props) {

    const {element, id} = props;
    const {t: translate} = useTranslation();

    if (typeof translate !== 'function') {
        console.error('Translate service is not a function');
        return;
    }
    if (typeof debounce !== 'function') {
        console.error('debounce is not a function');
        return;
    }

    const options = ['on', 'off'];

    const getValue = () => element.businessObject.lux || '';
    const getOptions = () => options.map(option => ({ label: option, value: option }));
    const setValue = value => {
        if (options.includes(value)) {
            element.businessObject.lux = value;
        } else {
            console.error(`Invalid value: ${value}. Must be one of ${options.join(', ')}`);
            element.businessObject.lux = 'off';
        }
    }

    return <SelectEntry
        id={ id }
        element={ element }
        label={ translate('Lux') }
        getValue={ getValue }
        getOptions= {getOptions}
        setValue ={setValue}
        debounce={ debounce }
    />
}
