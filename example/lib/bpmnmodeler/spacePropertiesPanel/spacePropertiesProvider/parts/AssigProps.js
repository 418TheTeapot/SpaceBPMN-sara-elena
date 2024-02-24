import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is } from "../../../../util/Util";
import {values} from "lodash";

export default function AssignmentProps(element, modeler) {
    const properties = [];

    if (is(element, 'bpmn:Task') || is(element, 'bpmn:Participant')) {
        properties.push(
            {
                id: 'Assignment',
                element,
                modeler,
                component: Assignment,
                isEdited: isTextFieldEntryEdited
            }
        );
    }

    return properties;
}

function Assignment(props) {
    const { element, id } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValues = () => {
        let values = element.businessObject.assignment || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        console.log('Array degli attributi di assegnazione:', values);
        return values;
    };

    const setValues = (value) => {
        return modeling.updateProperties(element, {
            assignment: value
        });
    };

    const addAttribute = () => {
        const newAttribute = {};
        const updatedAttributes = [...getValues(), newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '4px' }}>Add Assignments</span>
                <button onClick={addAttribute} style={{ background: 'white', color: 'black', border: '2px solid black', borderRadius: '4px',  cursor: 'pointer', fontSize: '16px' }}>+</button>
            </div>
            {getValues().map((attribute, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => attribute}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) => i === index ? newValue : attr);
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{ position: 'absolute', right: '30px', top: '0', background: 'transparent', border: 'none' }}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );

}
