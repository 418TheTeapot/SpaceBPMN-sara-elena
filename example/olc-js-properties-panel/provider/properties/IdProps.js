import {isTextFieldEntryEdited, TextAreaEntry, TextFieldEntry} from "@bpmn-io/properties-panel";

import {useService} from "../../hooks";
import {getBusinessObject, is} from "../../../lib/util/Util";

import { useCallback } from '@bpmn-io/properties-panel/preact/hooks';




export function IdProps(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'id',
           component: Id,
           isEdited: isTextFieldEntryEdited

        }
    ];
}

function Id(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    // console.log("Name function idelement: ", element);  // Log the element object
    // console.log("Name function idmodeling: ", modeling);  // Log the modeling object
    // console.log("Name function iddebounce: ", debounce);  // Log the debounce object
    // console.log("Name function idtranslate: ", translate);  // Log the translate object


    const setValue = (value, error) => {
        if (error) {
            return;
        }

        modeling.updateProperties(element, {
            id: value
        });
    };

    const getValue = useCallback((element) => {
        return getBusinessObject(element).id;
    }, [ element ]);


    return TextFieldEntry({
        element,
        id: 'id',
        label: translate(is(element, 'space:Place') ? 'Space ID' : 'ID'),
        getValue,
        setValue,
        debounce,
    });
}