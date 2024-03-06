import {

  getBusinessObject as getBusinessObjectModelUtil,
  is as isModelUtil
} from 'bpmn-js/lib/util/ModelUtil';


// import {
//   getBusinessObject as getBusinessObjectOlcUtil,
//   is as isOlcUtil
// } from '../example/lib/util/Util';


import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import {
  add as collectionAdd
} from 'diagram-js/lib/util/Collections';

import { TextAreaEntry, isTextAreaEntryEdited } from '@bpmn-io/properties-panel';

import {
  useService
} from '../../../hooks';

/**
 * @typedef { import('@bpmn-io/properties-panel').EntryDefinition } Entry
 */

/**
 * @returns {Array<Entry>} entries
 */
export function NameProps(props) {
  const {
    element
  } = props;

  if (isAny(element, [ 'bpmn:Collaboration', 'bpmn:DataAssociation', 'bpmn:Association' ])) {
    return [];
  }

  return [
    {
      id: 'name',
      component: Name,
      isEdited: isTextAreaEntryEdited
    }
  ];
}

function Name(props) {
  const {
    element
  } = props;

  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const canvas = useService('canvas');
  const bpmnFactory = useService('bpmnFactory');
  const translate = useService('translate');


  // OlcModeler

  const olcModelling = useService('olcModelling');
  const olcCanvas = useService('olc-canvas');
  const olcElementFactory = useService('olcElementFactory');


  let options = {
    element,
    id: 'name',
    label: translate('Name'),
    debounce,
    setValue: (value) => {
      if (isOlcElement(element)) {
        olcModelling.updateElementName(element, {name: value});
      } else {
        modeling.updateProperties(element, {name: value});
      }
    },
    getValue: (element) => {
      return element.businessObject.name;
    },
    autoResize: true
  };

  function isOlcElement(element) {
    return element && element.businessObject && element.businessObject.$type === 'space:';
  }


  if (is(element, 'bpmn:TextAnnotation')) {
    options = {
      ...options,
      setValue: (value) => {
        modeling.updateProperties(element, {text: value});
      },
      getValue: (element) => {
        return element.businessObject.text;
      }
    };
  } else if (isModelUtil(element, 'bpmn:Group')) {
    options = {
      ...options,
      setValue: (value) => {
        const businessObject = getBusinessObjectModelUtil(element),
            categoryValueRef = businessObject.categoryValueRef;

        if (!categoryValueRef) {
          initializeCategory(businessObject, canvas.getRootElement(), bpmnFactory);
        }

        modeling.updateLabel(element, value);
      },
      getValue: (element) => {
        const businessObject = getBusinessObjectModelUtil(element),
            categoryValueRef = businessObject.categoryValueRef;

        return categoryValueRef && categoryValueRef.value;
      }
    };
  } else if (isModelUtil(element, 'bpmn:Participant')) {
    options.label = translate('Participant Name');
  }

  return TextAreaEntry(options);
}


// helpers ////////////////////////

function initializeCategory(businessObject, rootElement, bpmnFactory) {
  const definitions = getBusinessObjectModelUtil(rootElement).$parent;

  const categoryValue = createCategoryValue(definitions, bpmnFactory);

  businessObject.categoryValueRef = categoryValue;
}

function createCategoryValue(definitions, bpmnFactory) {
  const categoryValue = bpmnFactory.create('bpmn:CategoryValue');

  const category = bpmnFactory.create('bpmn:Category', {
    categoryValue: [ categoryValue ]
  });

  // add to correct place
  collectionAdd(definitions.get('rootElements'), category);
  getBusinessObjectModelUtil(category).$parent = definitions;
  getBusinessObjectModelUtil(categoryValue).$parent = category;

  return categoryValue;
}
