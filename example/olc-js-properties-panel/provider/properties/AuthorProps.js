import {useService} from "../../hooks";

import {isTextAreaEntryEdited, TextAreaEntry} from "@bpmn-io/properties-panel";



export function AuthorProps(props) {

    const {
        element
    } = props;

    return [
        {
            id: 'author',
            component: Author,
            isEdited: isTextAreaEntryEdited
        }
    ];
}


function Author({ element }) {
    const modeling = useService('modeling');
    const translate = useService('translate')
    const debounce = useService('debounceInput');
    const moddle = useService('moddle');

    let options = {
        element,
        id: 'author',
        label: translate('Author'),
        debounce,
        setValue: (value) => {
            // Replace 'elementId', 'attributeName', and 'attributeValue' with actual values
            // moddle.setElementAttribute(element.id, 'author', value);
            // modeling.updateProperties(element, { author: value });
            // modeling.updateProperties(element, { newProperty: 'newValue' });
            modeling.updateProperties(element, { newProperty: 'newValue' });
        },
        getValue: (element) => {
            return element && element.businessObject ? element.businessObject.author : '';
        }
    };

    return <TextAreaEntry {...options} />;
}
