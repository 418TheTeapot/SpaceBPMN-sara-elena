import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useTranslation } from "react-i18next";
import { debounce } from 'lodash';
import { useEffect, useState } from "@bpmn-io/properties-panel/preact/hooks";

export function AssignmentProps(props) {
    const { t: translate } = useTranslation();
    const { element, id } = props;

    const getValues = () => {
        let values = element.businessObject.assignment || [];
        console.log("Initial values fetched:", values);  // Debugging line
        return Array.isArray(values) ? values : [values];
    };

    // Initialize state and set it based on element changes
    const [assignments, setAssignments] = useState(getValues());

    useEffect(() => {
        console.log("Element updated, fetching values again.");  // Debugging line
        setAssignments(getValues());
    }, [element]);

    const setValues = (value) => {
        console.log("Setting values:", value);  // Debugging line
        element.businessObject.assignment = value;
        setAssignments(value);  // Update the state as well to trigger re-render
    };

    const addAttribute = () => {
        const newAttribute = { value: '' };  // Assuming new attributes are simple objects with a 'value' property
        const updatedAttributes = [...assignments, newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = assignments.filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    const updateValue = (index, newValue) => {
        console.log(`Updating index ${index} with value`, newValue);  // Debugging line
        const updatedAttributes = assignments.map((attr, idx) =>
            idx === index ? { ...attr, value: newValue } : attr
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
            {assignments.map((attribute, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={`${id}-${index}`}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => attribute.value || ''}
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
