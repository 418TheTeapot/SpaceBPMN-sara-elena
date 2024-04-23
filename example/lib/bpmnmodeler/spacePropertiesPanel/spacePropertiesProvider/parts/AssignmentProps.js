import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export function Assignment(props) {
    const { element, id } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValues = () => {
        let values = element.businessObject.assignment || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        console.log('Array degli attributi: ', values);
        return values;
    };

    const setValues = (value) => {
        checkAssignments(value)
        console.log(element.businessObject.assignment)
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

    const checkAssignments = (values) => {
        values.forEach(attribute => {
            const stringValue = attribute.value;
            console.log(stringValue)
            if (stringValue && stringValue.includes("delete")) {
                console.log(`La stringa "${stringValue}" contiene "delete".`);
            }
            else if (stringValue && stringValue.includes("=")) {
                console.log(`La stringa "${stringValue}" contiene "=".`);
            }
        });
    };


    return (
        <div>
            <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '8px' }}>Add Assignment</span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid black', borderRadius: '3px',  cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {getValues().map((attribute, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => attribute.value || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
                            setValues(updatedAttributes);
                        }}
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
