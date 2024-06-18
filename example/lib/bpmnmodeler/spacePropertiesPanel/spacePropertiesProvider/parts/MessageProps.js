
import {TextFieldEntry, isTextAreaEntryEdited, TextAreaEntry} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export function MessageProps(props) {
    const { element, label, description } = props;

    return [
        {
            id: 'body',
            component: (props) => <Body {...props} label={label} description={description} />,
            isEdited: isTextAreaEntryEdited
        }
    ];
}


function Body(props) {
    const { element, id, label, description } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
        return element.businessObject.body || '';
    };

    const setValue = (value) => {
        return modeling.updateProperties(element, {
            body: value
        });
    };

    return (
        <TextAreaEntry
            id={id}
            element={element}
            description={description}
            label={label}
            getValue={getValue}
            setValue={setValue}
            debounce={debounce}
        />
    );
}

