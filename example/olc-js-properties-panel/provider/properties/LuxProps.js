import {useTranslation} from "react-i18next";
import {isSelectEntryEdited, SelectEntry} from "@bpmn-io/properties-panel";
import { debounce } from 'lodash';
import {is} from "../../../lib/util/Util";

export function LuxProps(props) {
    const { element } = props;

    if (is(element, 'space:Place')) {
        return [
            {
                id: 'lux',
                component: Lux,
                isEdited: isSelectEntryEdited
            }
        ];
    }
    return [];
}

function Lux(props) {
    const {element, id} = props;
    const { t: translate } = useTranslation();
    const options = ['ON', 'OFF'];

    const getValue = () => element.businessObject.lux || '';
    const getOptions = () => options.map(option => ({ label: option, value: option }));
    const setValue = value => {
        if (options.includes(value)) {
            element.businessObject.lux = value;
        } else {
            console.error(`Invalid value: ${value}. Must be one of ${options.join(', ')}`);
            element.businessObject.lux = 'OFF';
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