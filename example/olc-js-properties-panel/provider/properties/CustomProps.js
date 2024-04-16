// import {SelectEntry, TextAreaEntry} from "@bpmn-io/properties-panel";
// import {debounce} from "lodash";
//
//
//
// export function CustomProps
//
// ({ element ,id}) {
//     return [
//         {
//             id: 'customProperty',
//             component: TextAreaEntry,
//             isEdited: (element) => element.businessObject.customProperty,
//             set: (value, element) => {
//                 element.businessObject.customProperty = value;
//                 return element;
//             },
//             get: (element) => {
//                 return { customProperty: element.businessObject.customProperty };
//             }
//         },
//         {
//             id: 'newProperty',
//             component: TextAreaEntry,
//             isEdited: (element) => element.businessObject.newProperty,
//             set: (value, element) => {
//                 element.businessObject.newProperty = value;
//                 return element;
//             },
//             get: (element) => {
//                 return { newProperty: element.businessObject.newProperty };
//             }
//         },
//         <SelectEntry
//             id={ id }
//             element={ element }
//             label={ translate() }
//             getValue={ getValue }
//             getOptions= {getOptions}
//             setValue ={setValue}
//             debounce={ debounce }
//         />
//     ];
// }