// Import delle funzioni necessarie da altre librerie
import {
  query as domQuery
} from 'min-dom';

import {
  appendTo as svgAppendTo,
  create as svgCreate,
  attr as svgAttr,
  remove as svgRemove
} from 'tiny-svg';

// Import degli eventi utilizzati
import {
  RESET_SIMULATION_EVENT,
  PLAY_SIMULATION_EVENT,
  PAUSE_SIMULATION_EVENT,
  ANIMATION_CREATED_EVENT,
  ANIMATION_SPEED_CHANGED_EVENT,
  SCOPE_DESTROYED_EVENT,
  SCOPE_FILTER_CHANGED_EVENT
} from '../util/EventHelper';

// Import di una funzione di utilità
import { is } from "../../example/lib/util/Util";

// Ottenimento degli stili predefiniti
const STYLE = getComputedStyle(document.documentElement);
const DEFAULT_PRIMARY_COLOR = STYLE.getPropertyValue('--token-simulation-green-base-44');
const DEFAULT_AUXILIARY_COLOR = STYLE.getPropertyValue('--token-simulation-white');

// Funzione vuota utilizzata come placeholder
function noop() {}

// Funzione per ottenere la funzione di easing per un segmento
function getSegmentEasing(index, waypoints) {
  // Se c'è un solo segmento, utilizza una funzione di easing in/out
  if (waypoints.length === 2) {
    return EASE_IN_OUT;
  }
  // Se è il primo segmento, utilizza una funzione di easing in
  if (index === 1) {
    return EASE_IN;
  }
  // Se è l'ultimo segmento, utilizza una funzione di easing out
  if (index === waypoints.length - 1) {
    return EASE_OUT;
  }
  // Altrimenti, utilizza una funzione di easing lineare
  return EASE_LINEAR;
}

// Funzioni di easing predefinite
const EASE_LINEAR = function(pos) {
  return pos;
};
const EASE_IN = function(pos) {
  return -Math.cos(pos * Math.PI / 2) + 1;
};
const EASE_OUT = function(pos) {
  return Math.sin(pos * Math.PI / 2);
};
const EASE_IN_OUT = function(pos) {
  return -Math.cos(pos * Math.PI) / 2 + 0.5;
};

// Dimensione predefinita per il token
const TOKEN_SIZE = 20;
const TOKEN_SIZE_SPACE = 40;


// Definizione della classe Animation
export default function Animation(canvas, eventBus, scopeFilter, spaceModeler) {
  // Membrica per il bus degli eventi
  this._eventBus = eventBus;
  // Membrica per il filtro dello scope
  this._scopeFilter = scopeFilter;
  // Membrica per l'elemento canvas
  this._canvas = canvas;
  // Set per memorizzare le animazioni generiche
  this._animations = new Set();
  // Set per memorizzare le animazioni dello spazio
  this._spaceAnimations = new Set();
  // Velocità predefinita delle animazioni
  this._speed = 1;
  // Membrica per lo spaceModeler
  this._spaceModeler = spaceModeler;

  // Registrazione di gestori per gli eventi di reset, pausa e riproduzione della simulazione
  eventBus.on(RESET_SIMULATION_EVENT, () => {
    this.clearAnimations();
  });

  eventBus.on(PAUSE_SIMULATION_EVENT, () => {
    this.pause();
  });

  eventBus.on(PLAY_SIMULATION_EVENT, () => {
    this.play();
  });

  // Registrazione di un gestore per l'evento di modifica del filtro di visualizzazione
  eventBus.on(SCOPE_FILTER_CHANGED_EVENT, event => {
    this.each(animation => {
      if (this._scopeFilter.isShown(animation.scope)) {
        animation.show();
      } else {
        animation.hide();
      }
    });
  });

  // Registrazione di un gestore per l'evento di distruzione dello scope
  eventBus.on(SCOPE_DESTROYED_EVENT, event => {
    const {
      scope
    } = event;
    this.clearAnimations(scope);
  });
}

// Metodo per avviare un'animazione
Animation.prototype.animate = function(connection, scope, done) {
  this.createAnimation(connection, scope, done);
  this.createSpaceAnimation(connection,scope,done);
};

// Metodi per mettere in pausa e riprendere tutte le animazioni
Animation.prototype.pause = function() {
  this.each(animation => animation.pause());
  this.each(spaceAnimations => spaceAnimations.pause());  //No sense!!!
};


Animation.prototype.play = function() {
  this.each(animation => animation.play());
  this.each(spaceAnimations => spaceAnimations.play());

};

// Esegue una funzione per ogni animazione presente
Animation.prototype.each = function(fn) {
  this._animations.forEach(fn);
  this._spaceAnimations.forEach(fn);

};

// Metodo per creare un'animazione generica
// Metodo per creare un'animazione generica
Animation.prototype.createAnimation = function(connection, scope, done = noop) {
  const group = this._getGroup(scope);

  if (!group) {
    return;
  }

  console.log('Connection:');
  console.log('  Type:', connection.type);
  console.log('  ID:', connection.id);
  console.log('Scope:');
  console.log('  Type:', scope.element.type);
  console.log('  ID:', scope.element.id);

  const tokenGfx = this._createTokenGfx(group, scope);

  const animation = new TokenAnimation(tokenGfx, connection.waypoints, () => {
    this._animations.delete(animation);
    done();
  });



  animation.setSpeed(this.getAnimationSpeed());

  if (!this._scopeFilter.isShown(scope)) {
    animation.hide();
  }

  animation.scope = scope;
  animation.element = connection;

  this._animations.add(animation);
  this._eventBus.fire(ANIMATION_CREATED_EVENT, {
    animation
  });

  animation.play();

  return animation;
};

// Metodo per creare un'animazione specifica dello spazio
Animation.prototype.createSpaceAnimation = function(connection, scope, done = noop) {
  const group = this._getGroup(scope);

  if (!group) {
    return;
  }

  console.log("Di spaceAnimation :");

  console.log('Connection:');
  console.log('  Type:', connection.type);
  console.log('  ID:', connection.id);
  console.log('Scope:');
  console.log('  Type:', scope.element.type);
  console.log('  ID:', scope.element.id);

  let tokenGfx;
  if (scope.element && scope.element.type === 'space:Transition') {
    tokenGfx = this._createTokenGfxForSpace(group, scope);
  } else {
    console.log("Tipo di scope non supportato");
    return;
  }

  const spaceanimation = new TokenAnimation(tokenGfx, connection.waypoints, () => {
    this._spaceAnimations.delete(spaceanimation);
  });

  spaceanimation.spaceAnimation(done); // Passaggio di done come argomento



  spaceanimation.setSpeed(this.getAnimationSpeed());

  if (!this._scopeFilter.isShown(scope)) {
    spaceanimation.hide();
  }

  spaceanimation.scope = scope;
  spaceanimation.element = connection;

  console.log("GRAFICA");
  this._eventBus.fire(ANIMATION_CREATED_EVENT, {
    spaceanimation
  });

  console.log("FINE GRAFICA");
  spaceanimation.play();

  return spaceanimation;
};

// Metodi condivisi per la creazione del token grafico
Animation.prototype._createTokenGfx = function(group, scope) {
  if (scope.element.type === 'space:Transition') {
    return this._createTokenGfxForSpace(group, scope);
  } else {
    return this._createTokenGfxForBPMN(group, scope);
  }
};

// Metodo per creare il token grafico per gli elementi di spazio
Animation.prototype._createTokenGfxForSpace = function(group, scope) {
  const tokenSVG = this._getTokenSVGForSpace(scope);
  const parent = svgCreate(tokenSVG.trim());
  return svgAppendTo(parent, group);
};

// Metodo per creare il token grafico per gli elementi BPMN
Animation.prototype._createTokenGfxForBPMN = function(group, scope) {
  const tokenSVG = this._getTokenSVGForBPMN(scope);
  const parent = svgCreate(tokenSVG.trim());
  return svgAppendTo(parent, group);
};

// Ottiene il codice SVG per il token BPMN
Animation.prototype._getTokenSVGForBPMN = function(scope) {
  const colors = scope.colors || {
    primary: DEFAULT_PRIMARY_COLOR,
    auxiliary: DEFAULT_AUXILIARY_COLOR
  };

  // Codice SVG per il token BPMN
  return `
    <g class="bpmn-token">
      <circle
        class="bpmn-circle"
        r="${TOKEN_SIZE / 2}"
        cx="${TOKEN_SIZE / 2}"
        cy="${TOKEN_SIZE / 2}"
        fill="${ colors.primary }"
      />
      <text
        class="bpmn-text"
        transform="translate(10, 14)"
        text-anchor="middle"
        fill="${ colors.auxiliary }"
      >B</text>
    </g>
  `;
};

// Ottiene il codice SVG per il token dello Space Modeler
Animation.prototype._getTokenSVGForSpace = function(scope) {
  const colors = scope.colors || {
    primary: DEFAULT_PRIMARY_COLOR,
    auxiliary: DEFAULT_AUXILIARY_COLOR
  };

  // Codice SVG per il token dello Space Modeler
  return `
    <g class="space-token">
      <rect
        class="space-rect"
        width="${TOKEN_SIZE_SPACE}"
        height="${TOKEN_SIZE_SPACE}"
        fill="${ colors.primary }"
      />
      <text
        class="space-text"
        x="${TOKEN_SIZE_SPACE / 2}"
        y="${TOKEN_SIZE_SPACE / 2}"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="${ colors.auxiliary }"
      >S</text>
    </g>
  `;
};




// Imposta la velocità dell'animazione
Animation.prototype.setAnimationSpeed = function(speed) {
  this._speed = speed;

  // Imposta la velocità per ogni animazione
  this.each(animation => animation.setSpeed(speed));

  this._eventBus.fire(ANIMATION_SPEED_CHANGED_EVENT, {
    speed
  });
};

// Ottiene la velocità corrente dell'animazione
Animation.prototype.getAnimationSpeed = function() {
  return this._speed;
};

// Cancella tutte le animazioni
Animation.prototype.clearAnimations = function(scope) {
  this.each(animation => {
    if (!scope || animation.scope === scope) {
      animation.remove();
    }
  });
};


// Metodo per ottenere il gruppo grafico in cui inserire l'animazione
Animation.prototype._getGroup = function(scope) {

  // Ottieni il riferimento al canvas e al canvas dello spazio
  var canvas = this._canvas;
  var canvaSpace=this._spaceModeler._canvaspace.canvas;

  var layer, root, rootspace;

  // bpmn-js@9 compatibility:
  // Mostra i token dell'animazione sui layer del piano
  if ('findRoot' in canvas) {
    if(is(scope.element,'space:Transition')){
      rootspace = canvaSpace.findRoot(scope.element);
      layer = canvaSpace._findPlaneForRoot(rootspace).layer
    }
    else {
      root = canvas.findRoot(scope.element);
      layer = canvas._findPlaneForRoot(root).layer;
    }
  } else {
    layer = domQuery('.viewport', canvas._svg);
  }

  console.log(layer);

  // Ottieni il gruppo grafico per le animazioni, se non esiste, crealo
  var group = domQuery('.bts-animation-tokens', layer);

  if (!group) {
    group = svgCreate('<g class="bts-animation-tokens" />');
    svgAppendTo(
        group,
        layer
    );
  }
  return group;
};

// Definizione dei parametri per l'iniezione delle dipendenze
Animation.$inject = [
  'canvas',
  'eventBus',
  'scopeFilter',
  'spaceModeler'
];

// Costruttore per l'animazione di un token
function TokenAnimation(gfx, waypoints, done) {
  this.gfx = gfx;
  this.waypoints = waypoints;
  this.done = done;

  this._paused = true;
  this._t = 0;
  this._parts = [];

  this.create(); // Inizializzazione
}

// Metodo per gestire l'animazione specifica del tokenSpace
TokenAnimation.prototype.spaceAnimation = function(done) {
  // Seleziona il tokenSpace
  const tokenSpace = this.gfx.querySelector('.space-rect');

  // Salva il colore originale del token
  const originalColor = tokenSpace.getAttribute('fill');

  // Definisci il colore luminoso da utilizzare durante l'animazione
  const luminousColor = 'yellow';

  // Durata dell'animazione in millisecondi
  const animationDuration = 1000;

  // Effettua l'animazione cambiando il colore del token lungo il percorso
  tokenSpace.animate(
      { fill: [originalColor, luminousColor, originalColor] }, // Cambia il colore da originale a luminoso e poi di nuovo a originale
      { duration: animationDuration, iterations: Infinity } // Durata di 1 secondo e ripetizione infinita
  );

  // Chiamata alla funzione "done" quando l'animazione è completata (opzionale)
  if (done && typeof done === 'function') {
    setTimeout(done, animationDuration); // Chiamata alla funzione "done" dopo la durata dell'animazione
  }
};








// Metodi per mettere in pausa e riprendere l'animazione
TokenAnimation.prototype.pause = function() {
  this._paused = true;
};

TokenAnimation.prototype.play = function() {

  // console.log(this._paused)

  if (this._paused ) {
    this._paused = false;
    this.tick(0); // Inizia l'animazione
  }
  this.schedule();
};

// Metodo per schedulare l'animazione
TokenAnimation.prototype.schedule = function() {

  if (this._paused) {
    return;
  }

  if (this._scheduled) {
    return;
  }

  const last = Date.now();
  this._scheduled = true;

  requestAnimationFrame(() => {
    this._scheduled = false;

    if (this._paused) {
      return;
    }

    this.tick((Date.now() - last) * this._speed);
    this.schedule();
  });

};



// Metodo per avanzare nell'animazione
TokenAnimation.prototype.tick = function(tElapsed) {

  const t = this._t = this._t + tElapsed;
  const part = this._parts.find(
      p => p.startTime <= t && p.endTime > t
  );

  // Se l'animazione è completata, rimuovila
  if (!part) {
    console.log("Movimento completato");
    return this.remove();
  }

  const segmentTime = t - part.startTime;
  const segmentLength = part.length * part.easing(segmentTime / part.duration);

  const currentLength = part.startLength + segmentLength;

  const point = this._path.getPointAtLength(currentLength);

  this.move(point.x, point.y);
};

// Metodo per spostare l'animazione in una nuova posizione
TokenAnimation.prototype.move = function(x, y) {
  svgAttr(this.gfx, 'transform', `translate(${x}, ${y})`);
};

// Metodo per creare l'animazione
TokenAnimation.prototype.create = function() {
  const waypoints = this.waypoints;
  const parts = waypoints.reduce((parts, point, index) => {

    const lastPoint = waypoints[index - 1];

    if (lastPoint) {
      const lastPart = parts[parts.length - 1];

      const startLength = lastPart && lastPart.endLength || 0;
      const length = distance(lastPoint, point);

      parts.push({
        startLength,
        endLength: startLength + length,
        length,
        easing: getSegmentEasing(index, waypoints)
      });
    }

    return parts;
  }, []);

  const totalLength = parts.reduce(function(length, part) {
    return length + part.length;
  }, 0);

  const d = waypoints.reduce((d, waypoint, index) => {

    const x = waypoint.x - TOKEN_SIZE / 2,
        y = waypoint.y - TOKEN_SIZE / 2;

    d.push([ index > 0 ? 'L' : 'M', x, y ]);

    return d;
  }, []).flat().join(' ');

  const totalDuration = getAnimationDuration(totalLength);

  this._parts = parts.reduce((parts, part, index) => {
    const duration = totalDuration / totalLength * part.length;
    const startTime = index > 0 ? parts[index - 1].endTime : 0;
    const endTime = startTime + duration;

    return [
      ...parts,
      {
        ...part,
        startTime,
        endTime,
        duration
      }
    ];
  }, []);

  this._path = svgCreate(`<path d="${d}" />`);
  this._t = 0;
};

// Metodo per mostrare l'animazione
TokenAnimation.prototype.show = function() {
  svgAttr(this.gfx, 'display', '');
};

// Metodo per nascondere l'animazione
TokenAnimation.prototype.hide = function() {
  svgAttr(this.gfx, 'display', 'none');
};

// Metodo per rimuovere l'animazione
TokenAnimation.prototype.remove = function() {
  this.pause();

  svgRemove(this.gfx);

  this.done();
  return;
};

// Metodo per impostare la velocità dell'animazione
TokenAnimation.prototype.setSpeed = function(speed) {
  this._speed = speed;
};

// Funzione per calcolare la durata dell'animazione
function getAnimationDuration(length) {
  return Math.log(length) * randomBetween(250, 300);
}

// Funzione per generare un numero casuale tra min e max
function randomBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

// Funzione per calcolare la distanza tra due punti
function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
