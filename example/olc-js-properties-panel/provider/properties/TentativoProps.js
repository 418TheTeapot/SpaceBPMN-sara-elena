import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { Prova } from "./ProvaProps";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {SpaceProps} from "./SpaceProps";
import olcModeler from 'example/lib/olcmodeler/OlcModeler.js';

export default function TentativoProps(element) {
    const properties = [];

    if (is(element, 'space:Place')) {
        properties.push({
            id: 'prova',
            element,
            component: Prova,
            isEdited: isTextFieldEntryEdited
        });
    }

    return properties;
}

