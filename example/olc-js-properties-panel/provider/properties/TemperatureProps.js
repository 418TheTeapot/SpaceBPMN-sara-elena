// export function TemperatureProps({ element }) {
//     return [
//         {
//             id: 'temperature',
//             component: TextFieldEntry,
//             isEdited: isTextFieldEntryEdited,
//             get: (element) => {
//                 return { value: element.businessObject.get('spaceExt:temperature') };
//             },
//             set: (element, values) => {
//                 const props = { 'spaceExt:temperature': values.value };
//                 return cmdHelper.updateBusinessObject(element, element.businessObject, props);
//             }
//         }
//     ];
// }