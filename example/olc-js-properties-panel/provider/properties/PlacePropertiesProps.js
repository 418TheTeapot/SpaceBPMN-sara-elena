import {isSelectEntryEdited, isTextAreaEntryEdited, TextAreaEntry} from '@bpmn-io/properties-panel';
import {useService} from 'bpmn-js-properties-panel';
import {is} from "bpmn-js/lib/util/ModelUtil";
import {useTranslation} from "react-i18next";
import {debounce} from "lodash";
import OlcModeling from "../../../lib/olcmodeler/modeling/OlcModeling";


export function PlacePropertiesProps(props) {
    console.log(("Olc Props"))

    const {
        element
    } = props;

    return [
        {
            id: 'placeProperties',
            component: PlaceProperties,
            isEdited: isSelectEntryEdited // isTextAreaEntryEdited
        }
    ];
}

function PlaceProperties(props) {

    const {
        element
    } = props;


    const { t: translate } = useTranslation();

    if (typeof debounce !== 'function') {
        console.error('debounce is not a function');
        return;
    }

    if (typeof translate !== 'function') {
        console.error('Translate service is not a function');
        return;
    }

    // Define the options for the custom name entry
    let options = {
        element,
        id: 'placeProperties',
        label: translate('Place Properties'),
        debounce,
        setValue: (value) => {
            element.businessObject.placeProperties = value;
        },
        getValue: () => {
            return element.businessObject.placeProperties || '';
        },
        autoResize: true
    };

    return <TextAreaEntry {...options} />;
    //
    // const getValues = () => {
    //     let values = element.businessObject.placeProperties || [];
    //     if (!Array.isArray(values)) {
    //         values = [values];
    //     }
    //     console.log('Array delle propietà del place:', values);
    //     return values;
    // };
    //
    // const setValues = (value) => {
    //     return modeling.updateProperties(element, {
    //         placeProperties: value
    //     });
    // };
    //
    // const addAttribute = () => {
    //     const newAttribute = {};
    //     const updatedAttributes = [...getValues(), newAttribute];
    //     setValues(updatedAttributes);
    // };
    //
    // const removeAttribute = (index) => {
    //     const updatedAttributes = getValues().filter((_, i) => i !== index);
    //     setValues(updatedAttributes);
    // };
    //
    // return (
    //     <div>
    //         <div style={{ marginLeft: '12px', display: 'flex', justifyContent: 'left', alignItems: 'center', marginBottom: '1px' }}>
    //             <span style={{ marginRight: '8px' }}>Add Place Property</span>
    //             <button
    //                 onClick={addAttribute}
    //                 style={{ background: 'white', color: 'black', border: '1px solid black', borderRadius: '3px',  cursor: 'pointer', fontSize: '16px' }}>
    //                 +
    //             </button>
    //         </div>
    //         {getValues().map((attribute, index) => (
    //             <div key={index} style={{ position: 'relative' }}>
    //                 <TextFieldEntry
    //                     id={id}
    //                     element={element}
    //                     description={translate('')}
    //                     label={`PlaceProperties ${index + 1}`}
    //                     getValue={() => attribute.value || ''}
    //                     setValue={(newValue) => {
    //                         const updatedAttributes = getValues().map((attr, i) => i === index ? { ...attr, value: newValue } : attr);
    //                         setValues(updatedAttributes);
    //                     }}
    //                     debounce={debounce}
    //                 />
    //                 <button
    //                     onClick={() => removeAttribute(index)}
    //                     style={{ position: 'absolute', right: '30px', top: '0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
    //                     Remove
    //                 </button>
    //             </div>
    //         ))}
    //     </div>
    // );

//
//     if (is(element, 'space:Place')) {
//         properties.push({
//             id: 'id',
//             element,
//             olcModeler,
//             component: Light,
//             isEdited: isSelectEntryEdited
//         });
//     }
//     return properties;
// }
//
//
// function Light(props) {
//     const {element, id} = props;
//
//     const modeling = useService('modeling');
//     const translate = useService('translate');
//     const debounce = useService('debounceInput');
//
//     console.log("Light")
//
//     const getValue = () => {
//         return element.businessObject.light || '';
//     }
//
//     const setValue = value => {
//         return modeling.updateProperties(element, {
//             light: value
//         });
//     }
//
//     return <TextFieldEntry
//         id={id}
//         element={element}
//         description={translate('')}
//         label={translate('Light')}
//         getValue={getValue}
//         setValue={setValue}
//         debounce={debounce}
//     />
}
