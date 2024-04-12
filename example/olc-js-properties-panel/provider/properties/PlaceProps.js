import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import {is} from "bpmn-js/lib/util/ModelUtil";
import {SpaceProps} from "./SpaceProps";
import {Property} from "./PropertyProps";

export default function PlaceProps(element) {
    const properties = [];

    if (is(element, 'space:Place')) {
        properties.push({
            id: 'property',
            element,
            component: Property,
            isEdited: isTextFieldEntryEdited
        });
    }

    return properties;
}

