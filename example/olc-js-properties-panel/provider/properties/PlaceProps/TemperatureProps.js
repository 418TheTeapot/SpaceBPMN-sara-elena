import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from "react-i18next";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {debounce} from "lodash";

export function TemperatureProps(props) {
    const { element } = props;

    if (is(element, 'space:Place')) {  // Cambia qui per verificare se l'elemento è un 'Transition'
        return [
            {
                id: 'temperature',
                component: Temperature,
                isEdited: isTextFieldEntryEdited
            }
        ];
    }
    return [];
}

function Temperature(props) {
    const { element } = props;
    const { t: translate } = useTranslation();

    const getValue = () => element.businessObject.temperature || ''; // Prendi il valore corrente
    const setValue = (value) => {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) {
            element.businessObject.temperature = intValue;  // Imposta il valore convertito a integer
        } else {
            console.error("Invalid temperature value: ", value);
        }
    };

    return <TextFieldEntry
        id={props.id}
        element={element}
        label={translate('Temperature')}
        getValue={getValue}
        setValue={setValue}
        debounce={debounce}
    />;
}
