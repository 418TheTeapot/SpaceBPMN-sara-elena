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
        const assignmentString = element.businessObject.assignmentOlc || '';
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
                <span style={{ marginRight: '8px' }}>
                    {shouldTranslate ? assignmentLabel : 'Add Place Assignment'}
                </span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid black', borderRadius: '3px', cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {getValues().map((item, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: '5px', alignItems: 'center' }}>
                    <TextFieldEntry
                        id={`${id}-key-${index}`}
                        element={element}
                        description={translate('ex."lux"')}
                        label={`Attribute ${index + 1}`}
                        getValue={() => item.key}
                        setValue={(newKey) => {
                            const updatedItems = getValues();
                            updatedItems[index].key = newKey;
                            setValues(updatedItems);
                        }}
                        debounce={debounce}
                        style={{ flex: 1, marginRight: '1px' }} // Making the text field more extensive
                    />
                    <TextFieldEntry
                        id={`${id}-value-${index}`}
                        element={element}
                        description={translate('ex."on"')}
                        label={`Value ${index + 1}`}
                        getValue={() => item.value}
                        setValue={(newValue) => {
                            const updatedItems = getValues();
                            updatedItems[index].value = newValue;
                            setValues(updatedItems);
                        }}
                        debounce={debounce}
                        style={{ flex: 1, marginRight: '10px' }}
                    />
                    <button
                        onClick={() => removeAttribute(index)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginLeft: '1px'
                        }}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
}
