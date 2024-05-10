import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';

import {is} from "../../../lib/util/Util";
import {useService} from "../../hooks";

export function NameProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'name',
            component: Name,
            isEdited: isTextAreaEntryEdited
        }
    ];
}


function Name(props) {
    const { element } = props;

    // const { t: translate } = useTranslation();
    // const modeling = useService('modeling');

    const modeling = useService('modeling');
    const translate = useService('translate')
    const debounce = useService('debounceInput');

    // console.log("Name function element: ", element);  // Log the element object
    // console.log("Name function olcmodeling: ", modeling);  // Log the modeling object
    // console.log("Name function debounce : ", debounce);  // Log the translate object
    //
    // console.log("Name function translate: ", translate);  // Log the translate object

    let options = {
        element,
        id: 'name',
        label: is(element,'space:Transition') ? translate('Weight') : translate('Name'),
        debounce,
        setValue: (value) => {
            // modeling.element.businessObject.name = value;
            modeling.updateProperties(element, { name: value });
            modeling.updateLabel(element, value);
        },

       getValue: (element) => {
    // Added safety check to avoid TypeError
    return element && element.businessObject ? element.businessObject.name : '';
},
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}