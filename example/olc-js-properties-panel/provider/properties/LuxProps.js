
/*

import { useTranslation } from "react-i18next";
import { isSelectEntryEdited, SelectEntry } from "@bpmn-io/properties-panel";
import { debounce } from 'lodash';
import { is } from "../../../lib/util/Util";

export function LuxProps(props) {
    const { element } = props;
    console.log('Rendering LuxProps for', element); // Assicurati che l'elemento corretto sia passato qui

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
    const { element, id } = props;
    const { t: translate } = useTranslation();
    const options = ['ON', 'OFF'];

    const getValue = () => element.businessObject.lux || '';
    const getOptions = () => options.map(option => ({ label: option, value: option }));
   const setValue = value => {
    console.log(`Setting Lux value for ${element.id} to ${value}`);
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

*/


import { isTextAreaEntryEdited, TextAreaEntry} from '@bpmn-io/properties-panel';
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";


export  function LuxProps(props) {
    const { element } = props;

    return [
        {
            id: 'lux',
            component: Lux,
            isEdited: isTextAreaEntryEdited
        }
    ];
}

function Lux(props) {
    const { element, injector } = props;
    const { t: translate } = useTranslation();
    // const modeling = injector.get('modeling');

    let options = {
        element,
        id: 'lux',
        label: translate('Lux'),
        debounce,

        setValue: (value) => {
            // modeling.updateProperties(element, { lux: value });
            element.businessObject.lux = value;
        },
        getValue: (element) => {
            return element.businessObject.lux;
        }
    };

    return <TextAreaEntry {...options} />;
}
