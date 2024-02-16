// Import your custom property entries.
// The entry is a text input field with logic attached to create,
// update and delete the "spell" property.
import spaceProps from './parts/SpaceProps';
import timeProp from '../../exectionTime/executionTimeProvider/parts/TimeProps'
import CommonEvents from "../../../common/CommonEvents";
import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function SpacePropertiesProvider(propertiesPanel, translate, eventBus, spaceModeler) {

  // API ////////
  this._eventBus = eventBus;
  this._spaceModeler= spaceModeler;
  const modeler= this._spaceModeler;
  //const states = this._eventBus.fire(CommonEvents.GET_STATE);

  //console.log(this._spaceModeler);


  this.getGroups = function(element) {

    return function(groups) {

      // Add the "magic" group
      if(is(element, 'bpmn:Task')) {
        groups.push(createSpaceGroup(element, translate));
      }
      //add the "magic CURRENT POSITION" to PARTICIPANT
      if(is(element,'bpmn:Participant')){
        groups.push(createSpaceGroup(element,translate));
      }
    if(is(element,'bpmn:Process')){
        groups.push(createTimeGroup(element,translate))
      }
      return groups;
    }
  };

  // registration ////////

  // Register our custom properties provider.
  // Use a lower priority to ensure it is loaded after
  // the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);



  // Create the custom magic group
  function createSpaceGroup(element, translate) {
   // var modeler= this._spaceModeler;
  // create a group called "Magic properties".
  const spaceGroup ={
    id: 'space',
    label: translate('SpaceBPMN properties'),
    entries: spaceProps(element,modeler)
  };
  //destinationProps(spaceGroup, element, translate, bpmnFactory);
  return spaceGroup
}

function createTimeGroup(element, translate) {
  // var modeler= this._spaceModeler;
 // create a group called "Magic properties".
 const timeGroup ={
   id: 'executionTime',
   label: translate('Process Execution time'),
   entries: timeProp(element,modeler)
 };
 //destinationProps(spaceGroup, element, translate, bpmnFactory);
 return timeGroup
}

}
SpacePropertiesProvider.$inject = [ 'propertiesPanel', 'translate', 'eventBus', 'spaceModeler' ];


