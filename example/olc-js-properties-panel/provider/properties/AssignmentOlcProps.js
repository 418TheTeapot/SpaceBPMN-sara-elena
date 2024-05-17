import { useService } from "../../hooks";
import { isTextFieldEntryEdited, TextFieldEntry } from "@bpmn-io/properties-panel";

export function AssignmentOlcProps(props) {
    const { element } = props;
    return [{
        id: 'assignment',
        element,
        component: Assignment,
        isEdited: isTextFieldEntryEdited
    }];
}

function Assignment(props) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValues = () => {
        const assignmentString = element.businessObject.assignmentOlc|| '';
        return assignmentString.split(',').map(pair => {
            const [key, value] = pair.split('=').map(part => part.trim()); // Split key and value and trim whitespace
            return { key, value }; // Return as an object
        });
    };

    const setValues = (updatedItems) => {
        const assignmentString = updatedItems.map(item => `${item.key}=${item.value}`).join(', ');
        modeling.updateProperties(element, { assignmentOlc: assignmentString });
    };

    const addAttribute = () => {
        const updatedItems = [...getValues(), { key: '', value: '' }];
        setValues(updatedItems);
    };

    const removeAttribute = (index) => {
        const updatedItems = getValues().filter((_, i) => i !== index);
        setValues(updatedItems);
    };

    return (
        <div>
            <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '8px' }}>{translate('Add Assignment')}</span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid black', borderRadius: '3px', cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {getValues().map((item, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: '5px' }}>
                    <TextFieldEntry
                        id={`${id}-key-${index}`}
                        element={element}
                        description={translate('Edit the key')}
                        label={`Key ${index + 1}`}
                        getValue={() => item.key}
                        setValue={(newKey) => {
                            const updatedItems = getValues();
                            updatedItems[index].key = newKey;
                            setValues(updatedItems);
                        }}
                        debounce={debounce}
                    />
                    <TextFieldEntry
                        id={`${id}-value-${index}`}
                        element={element}
                        description={translate('Edit the value')}
                        label={`Value ${index + 1}`}
                        getValue={() => item.value}
                        setValue={(newValue) => {
                            const updatedItems = getValues();
                            updatedItems[index].value = newValue;
                            setValues(updatedItems);
                        }}
                        debounce={debounce}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', marginLeft: '10px' }}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
}
