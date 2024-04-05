import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import {OlcPropertiesPanelContext} from "../../context";
import {useContext} from "preact/hooks";
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";
import {useService} from "../../hooks";
import modeling from "../../../lib/olcmodeler/modeling";


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

    const { t: translate } = useTranslation();
    // const modeling = useService('modeling');

    let options = {
        element,
        id: 'name',
        label: translate('Name'),
        debounce,
        setValue: (value) => {
            element.businessObject.name = value;
        },

        getValue: (element) => {
            return element.businessObject.name;
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
}