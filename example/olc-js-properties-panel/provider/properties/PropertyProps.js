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
        // console.log(attribute.isOff),
        // console.log(attribute.value),
        // console.log(attribute.isOff.toString()),
        //     console.log(attribute && attribute.value ? attribute.value.toString() : "No value available"),
        console.log(attribute),
        index++
    ))}


    const setValues = (value) => {
        value.forEach(attribute => {
            attribute.isOff = attribute.isOff.toString();
            attribute.value = attribute.value ? attribute.value.toString() : ''; // Gestisci il caso in cui attribute.value sia undefined o null
        });
        element.businessObject.properties = value;
        console.log(element.businessObject.properties);
        element.businessObject.placeProperties = printAttributes(getValues());
        console.log(element.businessObject.placeProperties)
        return value;
        // const updatedProperties = value.map(attribute => ({
        //     isOff: attribute.isOff.toString(),
        //     value: attribute.value ? attribute.value.toString() : ''
        // }));
        // element.businessObject.properties = updatedProperties;
        // console.log(element.businessObject.properties);
        // return updatedProperties;
        // element.businessObject.properties = value;
        // {getValues().map((attribute, index) => (
        //     element.businessObject.property = attribute.value,
        //     element.businessObject.value = attribute.isOff
        // ))}
        // console.log(element.businessObject.properties);
        // return getValues();
    };

    const formatAttributeToString = (attribute) => {
        return `${attribute.value}=${attribute.isOff}`;
    };

// Funzione per stampare gli attributi come stringhe formattate
    const printAttributes = (values) => {
        return values.map(attribute => formatAttributeToString(attribute)).join(', ');
    };

// Utilizzo della funzione printAttributes per stampare gli attributi come stringhe formattate
    console.log(printAttributes(getValues()));

    const addAttribute = () => {
        const newAttribute = {isOff: 'true'};
        const updatedAttributes = [...getValues(), newAttribute];
        setValues(updatedAttributes);
    };

    const removeAttribute = (index) => {
        const updatedAttributes = getValues().filter((_, i) => i !== index);
        setValues(updatedAttributes);
    };

    const toggleOff = (index) => {
        const updatedAttributes = getValues();
        updatedAttributes[index].isOff = updatedAttributes[index].isOff === 'true' ? 'false' : 'true'; // Converti in stringa
        //updatedAttributes[index].isOff = !updatedAttributes[index].isOff;
        setValues(updatedAttributes);
        // if (isOffValue) {
        //     element.businessObject.value = 'off';
        // } else {
        //     element.businessObject.value = 'on';
        // }
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
