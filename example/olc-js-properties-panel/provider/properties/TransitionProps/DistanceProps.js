import {TextAreaEntry, isTextAreaEntryEdited, TextFieldEntry} from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';

import {debounce} from "lodash";
import {is} from "../../../../lib/util/Util";


export function DistanceProps(props) {
    const {
        element
    } = props;

    if (is(element, 'space:Transition')) {
        return [
            {
                id: 'distance',
                component: Distance,
                isEdited: isTextAreaEntryEdited
            }
        ];
    }
}


function Distance(props) {
    const { element } = props;

    const { t: translate } = useTranslation();
    // const modeling = useService('modeling');

    const getValue = () => element.businessObject.distance || ''; // Prendi il valore corrente
    const setValue = (value) => {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) {
            element.businessObject.distance = intValue;  // Imposta il valore convertito a integer
        } else {
            console.error("Invalid distance value: ", value);
        }
    };

    return <TextFieldEntry
        id={props.id}
        element={element}
        label={translate('Distance')}
        getValue={getValue}
        setValue={setValue}
        debounce={debounce}
    />;
}