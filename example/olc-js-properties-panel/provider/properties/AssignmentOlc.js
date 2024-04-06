import {isTextAreaEntryEdited, TextAreaEntry} from "@bpmn-io/properties-panel";
import {useTranslation} from "react-i18next";
import { debounce } from 'lodash';

/*
export function AssignmentOlc(props) {
    const {
        element
    } = props;

    return [
        {
            id: 'assignment',
            component: Assignment,
            isEdited: isTextAreaEntryEdited
        }
    ];
}

function Assignment(props) {
    const {element} = props;

    const { t: translate } = useTranslation();

    let options = {
        element,
        id: 'assignment',
        label: translate('Assignment'),
        debounce,
        setValue: (value) => {
            element.businessObject.assignment = value;
        },

        getValue: (element) => {
            return element.businessObject.assignment;
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;



}

*/