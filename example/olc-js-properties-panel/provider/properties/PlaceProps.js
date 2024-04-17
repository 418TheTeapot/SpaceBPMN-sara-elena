import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import {is} from "bpmn-js/lib/util/ModelUtil";
import {SpaceProps} from "./SpaceProps";
import {Property} from "./PropertyProps";

export default function PlaceProps(element) {
    const properties = [];

    if (is(element, 'space:Place')) {
        const propertyValue = element.businessObject.property || '';
        const isOffValue = propertyValue === 'off';

        properties.push({
            id: 'placeProperties',
            element,
            component: Property,
            propertyValue,
            isOffValue,
            isEdited: isTextFieldEntryEdited,
        });
    }

    return properties;
}

