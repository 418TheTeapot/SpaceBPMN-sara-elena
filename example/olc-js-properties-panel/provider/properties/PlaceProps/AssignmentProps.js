import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from "react-i18next";
import { debounce } from 'lodash';
import { useEffect, useState } from "@bpmn-io/properties-panel/preact/hooks";

export function AssignmentProps(props) {
    const { t: translate } = useTranslation();
    const { element, id } = props;

    const getValues = () => {
        // Assicuriamoci che `assignment` sia sempre trattato come array
        let values = element.businessObject.assignment || [];
        return Array.isArray(values) ? values : [values];
    };

    const [assignments, setAssignments] = useState(getValues());

    useEffect(() => {
        setAssignments(getValues());
    }, [element]);

    const setValues = (values) => {
        element.businessObject.assignment = values;
        setAssignments(values);  // Update the state as well to trigger re-render
    };

    const addAttribute = () => {
        const updatedAttributes = [...assignments, ''];  // Aggiunge una stringa vuota per un nuovo assignment
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = assignments.filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    const updateValue = (index, newValue) => {
        const updatedAttributes = assignments.map((attr, idx) =>
            idx === index ? newValue : attr
        );
        setValues(updatedAttributes);
    };

    return (
        <div>
            <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '8px' }}>Add Assignment</span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid black', borderRadius: '3px', cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {assignments.map((value, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={`${id}-${index}`}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => value || ''}
                        setValue={(newValue) => updateValue(index, newValue)}
                        debounce={debounce}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{ position: 'absolute', right: '30px', top: '0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
}


