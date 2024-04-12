import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";

export function Property(props) {
    const { element, id } = props;

    const { t: translate } = useTranslation();

    const getValues = () => {
        let values = element.businessObject.property || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        return values;
    };

    console.log('proprietà', getValues());

    const setValues = (value) => {
        console.log(element.businessObject.property);
        element.businessObject.property = value;
        return getValues();
    };

    const addAttribute = () => {
        const newAttribute = {isOff: true};
        const updatedAttributes = [...getValues(), newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    const toggleOff = (index) => {
        const updatedAttributes = getValues();
        updatedAttributes[index].isOff = !updatedAttributes[index].isOff;
        setValues(updatedAttributes);
        console.log('toggle off/on', updatedAttributes);
    };

    return (
        <div>
            <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '0.25px' }}>Add property</span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid white', cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {getValues().map((attribute, index) => (
                <div key={index} style={{position: 'relative'}}>
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Property ${index + 1}`}
                        getValue={() => attribute.value || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((attr, i) => i === index ? {
                                ...attr,
                                value: newValue
                            } : attr);
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <button
                            onClick={() => toggleOff(index)}
                            style={{marginLeft: '8px', background: 'transparent',  border: 'none',  cursor: 'pointer',  fontSize: '12px',  marginRight: '5px'
                            }}>
                            {attribute.isOff ? 'On' : 'Off'}
                        </button>
                        <button
                            onClick={() => removeAttribute(index)}
                            style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px'}}>
                            Remove
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

}
