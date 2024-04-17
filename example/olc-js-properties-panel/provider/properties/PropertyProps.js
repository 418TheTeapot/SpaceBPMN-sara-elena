import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";

export function Property(props) {
    const { element, id } = props;

    const { t: translate } = useTranslation();

    const getValues = () => {
        let values = element.businessObject.properties || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        return values;
    };

    console.log('proprietà', getValues());

    {getValues().map((property, index) => (
        console.log(property),
            index++
    ))}


    const setValues = (value) => {
        value.forEach(property => {
            property.value = property.value ? property.value.toString() : '';
            property.attribute = property.attribute ? property.attribute.toString() : '';
        });
        element.businessObject.properties = value;
        console.log(element.businessObject.properties);
        //aggiunge le proprietà all'xml
        element.businessObject.placeProperties = printAttributes(getValues());
        console.log(element.businessObject.placeProperties)
        return value;
    };

    const formatAttributeToString = (property) => {
        return `${property.value}=${property.attribute}`;
    };

    // Funzione per stampare gli attributi come stringhe formattate
    const printAttributes = (values) => {
        return values.map(property => formatAttributeToString(property)).join(', ');
    };

    console.log(printAttributes(getValues()));

    const addAttribute = () => {
        const newAttribute = { value: '', attribute: '' }; // Inizializza newAttribute con valori vuoti
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
                <span style={{ marginRight: '0.25px' }}>Add property</span>
                <button
                    onClick={addAttribute}
                    style={{ background: 'white', color: 'black', border: '1px solid white', cursor: 'pointer', fontSize: '16px' }}>
                    +
                </button>
            </div>
            {getValues().map((property, index) => (
                <div key={index} style={{position: 'relative'}}>
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Property ${index + 1}`}
                        getValue={() => property.value || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((prop, i) => i === index ? {
                                ...prop,
                                value: newValue
                            } : prop);
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <TextFieldEntry
                        id={id}
                        element={element}
                        description={translate('')}
                        label={`Attribute property ${index + 1}`}
                        getValue={() => property.attribute || ''}
                        setValue={(newValue) => {
                            const updatedAttributes = getValues().map((prop, i) => i === index ? {
                                ...prop,
                                attribute: newValue
                            } : prop);
                            setValues(updatedAttributes);
                        }}
                        debounce={debounce}
                    />
                    <div style={{display: 'flex', alignItems: 'center'}}>
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