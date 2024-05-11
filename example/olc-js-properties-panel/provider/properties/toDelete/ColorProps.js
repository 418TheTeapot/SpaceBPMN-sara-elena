import {isTextAreaEntryEdited} from "@bpmn-io/properties-panel";


export function ColorProps(props) {
    const { element } = props;

    return [
        {
            id: 'color',
            component: Color,
            isEdited: isTextAreaEntryEdited // You can define a specific function to determine if the color has been edited
        }
    ];
}

import { useService } from "../../../hooks";

function Color(props) {
    const { element } = props;
    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    let options = {
        element,
        id: 'color',
        label: translate('Color'),  // Assume you have a translation key for "Color"
        debounce,
        setValue: (value) => {
            modeling.updateProperties(element, { color: value });
            // eventBus.fire('element.changed', { element: element });
        },
        getValue: (element) => {
            // Safety check to avoid TypeError
            return element && element.businessObject ? element.businessObject.color : '#FFFFFF';  // Default to white if no color is set
        },
        autoResize: true
    };

    return (
        <input
            type="color"
            value={options.getValue(element)}
            onChange={(e) => options.setValue(e.target.value)}
            style={{ width: '100%' }}  // Ensure the color picker spans the full width of the panel
        />
    );
}

