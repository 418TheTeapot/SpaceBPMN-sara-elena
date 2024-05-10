import {isTextAreaEntryEdited, TextAreaEntry} from "@bpmn-io/properties-panel";
import {useService} from "../../hooks";



export function CustomProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'customProps',
            component: CustomProperty,
            isEdited: isTextAreaEntryEdited
        }
    ];

}




function CustomProperty(props) {
    const { element, property } = props;

    const modeling = useService('modeling');
    const translate = useService('translate')
    const debounce = useService('debounceInput');

    function setCustomProps(element, name, value) {
    // Check if the element exists
    if (element) {
        // Create the customProps object
        let customProps = {
            name: name,
            value: value
        };

        // Update the customProps of the element
        modeling.updateModdleProperties(element, element.businessObject, { customProps });
        modeling.updateProperties(element, { customProps });
    }
}

let nameOptions = {
    element,
    id: 'propertyName',
    label: translate('Property Name'),
    debounce,
    setValue: (name) => {
        if (element && property) {
            setCustomProps(element, name, property.value);
        }
    },
    getValue: (element) => {
        return property ? property.name || '' : '';
    },
    autoResize: true
};


let valueOptions = {
    element,
    id: 'propertyValue',
    label: translate('Property Value'),
    debounce,

    setValue: (value) => {
        if (element && property) {
            setCustomProps(element, property.name, value);
        }
    },
    getValue: (element) => {
        return property ? property.value || '' : '';
    },
    autoResize: true
};

    return (
        <>
            <TextAreaEntry {...nameOptions} />
            <TextAreaEntry {...valueOptions} />
        </>
    );
}