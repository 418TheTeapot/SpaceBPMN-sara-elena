
import {
  assign
} from 'min-dash';

//TODO rename prefix
export default function PaletteProvider(
  palette, create, elementFactory,
  spaceTool, lassoTool, handTool, globalConnect, translate, canvas) {

  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._translate = translate;
  this._canvas= canvas;  
  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate',
  'canvas'
];

PaletteProvider.prototype.getPaletteEntries = function (element) {

  var actions = {},
      create = this._create,
      elementFactory = this._elementFactory,
      spaceTool = this._spaceTool,
      lassoTool = this._lassoTool,
      handTool = this._handTool,
      globalConnect = this._globalConnect,
      translate = this._translate;

  function createAction(type, group, className, title, options) {

    function createListener(event) {
      console.log('Creating shape:', type); // Aggiungi questo console log

      var shape = elementFactory.createShape(assign({type: type}, options));
      create.start(event, shape);
    }

    return {
      group: group,
      className: className,
      title: title,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  assign(actions, {
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: translate('Activate the hand tool'),
      action: {
        click: function (event) {
          console.log('Activating hand tool'); // Aggiungi questo console log

          handTool.activateHand(event);
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      action: {
        click: function (event) {
          console.log('Activating lasso tool'); // Aggiungi questo console log

          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: translate('Activate the create/remove space tool'),
      action: {
        click: function (event) {
          console.log('Activating space tool'); // Aggiungi questo console log

          spaceTool.activateSelection(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'create-object': createAction(
        'space:Place', 'space-elements', 'bpmn-icon-start-event-none',
        translate('Create place')
    ),
    /* 'create-object': createAction(
       'space:FinalDest', 'space-elements', 'bpmn-icon-end-event-none',
       translate('Create Final Destination Place')
     ),*/
    'object-linker': {
      group: 'space-elements',
      className: 'bpmn-icon-connection',
      title: translate('Create connection'),
      action: {
        click: function (event) {
          console.log('Starting global connection'); // Aggiungi questo console log

          globalConnect.start(event);

          console.log('Creating transition'); // Aggiungi questo console log
        }
      }
    }

  });

  return actions;
};
