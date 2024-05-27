import inherits from 'inherits';
import { groupBy, without } from 'min-dash';

import Diagram from 'diagram-js';


import ConnectModule from 'diagram-js/lib/features/connect';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import CreateModule from 'diagram-js/lib/features/create';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import ModelingModule from 'diagram-js/lib/features/modeling';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import MoveModule from 'diagram-js/lib/features/move';
import OutlineModule from 'diagram-js/lib/features/outline';
import PaletteModule from 'diagram-js/lib/features/palette';
import RulesModule from 'diagram-js/lib/features/rules';
import SelectionModule from 'diagram-js/lib/features/selection';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import EditorActionsModule from '../common/editor-actions';
import CopyPasteModule from 'diagram-js/lib/features/copy-paste';
import KeyboardModule from '../common/keyboard';

import OlcPaletteModule from './palette';
import OlcDrawModule from './draw';
import OlcRulesModule from './rules';
import OlcModelingModule from './modeling';
import OlcAutoPlaceModule from './auto-place';

import OlcModdle from './moddle';
import OlcEvents from './OlcEvents';
import { nextPosition, root, is } from '../util/Util';

// XML vuoto
var emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<space:definitions xmlns:space="http://bptlab/schema/spaceModeler">
  <space:space name="SpaceDiagram" id="Space_Diagram">
  </space:space>
</space:definitions>`;

export default function OlcModeler(options) {
  const {
    container,
    additionalModules = [],
    keyboard,
    propertiesPanel
  } = options;

  const builtinModules = [
    ConnectModule,
    ConnectionPreviewModule,
    ContextPadModule,
    CreateModule,
    LassoToolModule,
    ModelingModule,
    MoveCanvasModule,
    MoveModule,
    OutlineModule,
    PaletteModule,
    RulesModule,
    SelectionModule,
    ZoomScrollModule,
    EditorActionsModule,
    KeyboardModule,
    CopyPasteModule
  ];

  const customModules = [
    // OlcElementFactory, // Aggiungi OlcElementFactory qui
    OlcPaletteModule,
    OlcDrawModule,
    OlcRulesModule,
    OlcModelingModule,
    OlcAutoPlaceModule,

    {
      moddle: ['value', new OlcModdle({})],
      olcModeler: ['value', this],
    },
  ];

  const diagramOptions = {
    canvas: {
      container
    },
    keyboard,
    modules: [
      ...builtinModules,
      ...customModules,
      ...additionalModules
    ],
    propertiesPanel
  };

  Diagram.call(this, diagramOptions);

  this.get('eventBus').fire('attach'); // Necessario per far funzionare i listener di tasti
}
inherits(OlcModeler, Diagram);

OlcModeler.prototype.createNew = function () {
  return this.importXML(emptyDiagram);
};

OlcModeler.prototype.importXML = function (xml) {
  var self = this;

  return new Promise(function (resolve, reject) {
    xml = self._emit('import.parse.start', { xml: xml }) || xml;

    self.get('moddle').fromXML(xml).then(function (result) {
      var definitions = result.rootElement;
      var references = result.references;
      var parseWarnings = result.warnings;
      var elementsById = result.elementsById;

      var context = {
        references: references,
        elementsById: elementsById,
        warnings: parseWarnings
      };

      for (let id in elementsById) {
        self.get('elementFactory')._ids.claim(id, elementsById[id]);
      }

      definitions = self._emit('import.parse.complete', {
        definitions: definitions,
        context: context
      }) || definitions;

      self.importDefinitions(definitions);
      self._emit('import.done', { error: null, warnings: null });
      resolve();
    }).catch(function (err) {
      self._emit('import.parse.failed', {
        error: err
      });

      self._emit('import.done', { error: err, warnings: err.warnings });

      return reject(err);
    });
  });
};

OlcModeler.prototype.importDefinitions = function (definitions) {
  var self = this;
  self.get('elementFactory')._ids.clear();
  this._definitions = definitions;

  self._emit(OlcEvents.DEFINITIONS_CHANGED, { definitions: definitions });
  self._emit('import.render.start', { definitions: definitions });

  self.showOlc(definitions.places);
  self._emit('import.render.complete', {});
};

OlcModeler.prototype.showOlc = function (space) {
  this.clear();
  this._space = space;
  if (space) {
    const elementFactory = this.get('elementFactory');
    var diagramRoot = elementFactory.createRoot({ type: 'space:Space', businessObject: space });
    const canvas = this.get('canvas');
    canvas.setRootElement(diagramRoot);

    var elements = groupBy(space.get('Elements'), element => element.$type);
    var states = {};

    (elements['space:Place'] || []).forEach(place => {
      var stateVisual = elementFactory.createShape({
        type: 'space:Place',
        businessObject: place,
        x: parseInt(place.get('x')),
        y: parseInt(place.get('y'))
      });
      states[place.get('id')] = stateVisual;
      canvas.addShape(stateVisual, diagramRoot);
    });

    (elements['space:Transition'] || []).forEach(transition => {
      var source = states[transition.get('sourcePlace').get('id')];
      var target = states[transition.get('targetPlace').get('id')];
      var transitionVisual = elementFactory.createConnection({
        type: 'space:Transition',
        businessObject: transition,
        source: source,
        target: target,
        waypoints: this.get('olcUpdater').connectionWaypoints(source, target)
      });
      canvas.addConnection(transitionVisual, diagramRoot);
    });
  }
  this._emit(OlcEvents.SELECTED_OLC_CHANGED, { space: space });
};

OlcModeler.prototype.getDefinitions = function() {
  return this._definitions;
};

OlcModeler.prototype.on = function(event, priority, callback, target) {
  return this.get('eventBus').on(event, priority, callback, target);
};



OlcModeler.prototype.getOlcs = function() {
  return this._definitions.get('places');
};

OlcModeler.prototype.handleShapeChanges = function (space) {
  console.log(this.get('elementRegistry'));
};

OlcModeler.prototype.saveXML = function (options) {
  options = options || {};

  var self = this;
  var definitions = this._definitions;

  return new Promise(function (resolve, reject) {
    if (!definitions) {
      var err = new Error('no xml loaded');
      return reject(err + definitions);
    }

    definitions = self._emit('saveXML.start', {
      definitions: definitions
    }) || definitions;

    self.get('moddle').toXML(definitions, options).then(function (result) {
      var xml = result.xml;

      try {
        xml = self._emit('saveXML.serialized', {
          error: null,
          xml: xml
        }) || xml;

        self._emit('saveXML.done', {
          error: null,
          xml: xml
        });
      } catch (e) {
        console.error('error in saveXML life-cycle listener', e);
      }

      return resolve({ xml: xml });
    }).catch(function (err) {
      return reject(err);
    });
  });
};

OlcModeler.prototype._emit = function (type, event) {
  return this.get('eventBus').fire(type, event);
};

OlcModeler.prototype.ensureElementIsOnCanvas = function (element) {
  if (!this.get('elementRegistry').get(element.id)) {
    const rootElement = root(element);
    if (this.getOlcs().includes(rootElement)) {
      this.showOlc(rootElement);
    } else {
      throw 'Cannot display element. Is not part of a known olc';
    }
  }
};
