import {isSelectEntryEdited, isTextAreaEntryEdited, TextAreaEntry} from '@bpmn-io/properties-panel';
import {useService} from 'bpmn-js-properties-panel';
import {is} from "bpmn-js/lib/util/ModelUtil";
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";


export function PlacePropertiesProps(props) {

    const {
        element
    } = props;

    return [
        {
            id: 'properties',
            component: PlaceProperties,
            isEdited: isTextAreaEntryEdited
        }
    ];
}

function PlaceProperties(props) {

    const {element, id} = props;


    const {t: translate} = useTranslation();

    if (typeof debounce !== 'function') {
        console.error('debounce is not a function');
        return;
    }

    if (typeof translate !== 'function') {
        console.error('Translate service is not a function');
        return;
    }

    let options = {
        element,
        id,
        label: translate('Place Properties'),
        debounce,
        setValue: (value) => {
            element.businessObject.properties = value;
        },
        getValue: () => {
            return element.businessObject.properties || '';
        },
        autoResize: true
    };

    console.log(element.businessObject.properties)

    return <TextAreaEntry {...options} />;
}