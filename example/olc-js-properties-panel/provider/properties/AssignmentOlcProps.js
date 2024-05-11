import {useService} from "../../hooks";
import {isTextFieldEntryEdited, TextFieldEntry} from "@bpmn-io/properties-panel";

export function AssignmentOlcProps(props) {
    const {element} = props;
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
        let values = element.businessObject.assignment || [];
        return Array.isArray(values) ? values : [values];
    };

    const setValues = (values) => {
        modeling.updateProperties(element, {
            assignment: values
        });
    };

    const addAttribute = () => {
        const newAttribute = '';
        const updatedAttributes = [...getValues(), newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
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
            {getValues().map((value, index) => (
                <div key={index} style={{ position: 'relative' }}>
                    <TextFieldEntry
                        id={`${id}-${index}`}
                        element={element}
                        description={translate('')}
                        label={`Assignment ${index + 1}`}
                        getValue={() => value || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) =>
                                i === index ? newValue : attr
                            );
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