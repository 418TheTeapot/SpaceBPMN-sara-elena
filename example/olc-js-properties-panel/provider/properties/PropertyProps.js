import { TextFieldEntry,  isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";

export function Property(props) {
    const { element, id, propertyValue, isOffValue } = props;

    const { t: translate } = useTranslation();

    const getValues = () => {
        let values = element.businessObject.properties || [];
        if (!Array.isArray(values)) {
            values = [values];
        }
        return values;
    };

    console.log('proprietà', getValues());
    // console.log(getValues().value);
    // console.log(getValues().isOff);
    {getValues().map((attribute, index) => (
        console.log(attribute.isOff),
        console.log(attribute.value)
    ))}


    const setValues = (value) => {
        element.businessObject.properties = value;
        {getValues().map((attribute, index) => (
            element.businessObject.property = attribute.value,
            element.businessObject.value = attribute.isOff
        ))}
        console.log(element.businessObject.property);
        // console.log(element.businessObject.property.value);
        // console.log(element.businessObject.property.isOff);
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
        if (isOffValue) {
            element.businessObject.value = 'off';
        } else {
            element.businessObject.value = 'on';
        }
        console.log('toggle off/on', updatedAttributes);
    };

    // const toggleOff = () => {
    //     const updatedValue = isOffValue ? 'on' : 'off'; // Cambia il valore tra 'on' e 'off'
    //     setValues(updatedValue);
    //     if (isOffValue) {
    //         element.businessObject.value = 'on';
    //     } else {
    //         element.businessObject.value = 'off';
    //     }
    // };


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
                     {attribute.isOff ? 'Off' : 'On'}
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



/*
    return (
        <div>
            <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
                <span style={{ marginRight: '0.25px' }}>Add property</span>
                <button
                    onClick={toggleOff}
                    style={{ background: 'white', color: 'black', border: '1px solid white', cursor: 'pointer', fontSize: '16px' }}>
                    {isOffValue ? 'Off' : 'On'}
                </button>
            </div>
            <TextFieldEntry
                id={id}
                element={element}
                description={translate('')}
                label={`Property`}
                getValue={() => propertyValue || ''}
                setValue={(newValue) => setValues(newValue)}
                debounce={debounce}
            />
        </div>
    );
}
*/
