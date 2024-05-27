import { add as collectionAdd } from 'diagram-js/lib/util/Collections';

export function linkToBusinessObjectParent(element) {
    var businessObject = element.businessObject,
        parentBusinessObject = element.parent.businessObject;

    if (businessObject && parentBusinessObject && parentBusinessObject.get('Elements')) {
        collectionAdd(parentBusinessObject.get('Elements'), businessObject);
        businessObject.$parent = parentBusinessObject;
        console.log('Linked to business object parent:', businessObject);
    } else {
        console.warn('Parent business object or its Elements collection not found for:', element);
    }
}
