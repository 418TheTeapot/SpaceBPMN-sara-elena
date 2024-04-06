


import {isSelectEntryEdited, isTextFieldEntryEdited, SelectEntry, TextFieldEntry} from "@bpmn-io/properties-panel";
import {is} from "../../../../util/Util";
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";

export default function SpaceOlcProps(element, modeler) {
    const properties = [];

    if (is(element, 'space:Place')) {
        properties.push({
            id: 'lux',
            element,
            modeler,
            component: Lux,
            isEdited: isSelectEntryEdited
        });
    } // Added closing brace

    return properties;
}



function Lux(props) {
    const {element} = props;

    const { t: translate } = useTranslation();

    let options = {
        element,
        id: 'lux',
        label: translate('Lux'),
        debounce,
        setValue: (value) => {
            element.businessObject.lux = value;
        },
        getValue: (element) => {
            return element.businessObject.lux;
        },
        getOptions: () => ([
            { value: 'ON', name: 'ON' },
            { value: 'OFF', name: 'OFF' }
        ])
    };

    return <SelectEntry {...options} />;
}


