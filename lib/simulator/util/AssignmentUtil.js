import { is } from "../../../example/lib/util/Util";

export class AssignmentUtil {
    static parseAssignmentOlc(assignmentOlc) {
        const assignmentObj = {};
        if (assignmentOlc && typeof assignmentOlc === "string") {
            assignmentOlc.split(',').forEach(assignment => {
                const parts = assignment.split("=").map(part => part.trim().replace(/"/g, ''));
                if (parts.length === 2) {
                    assignmentObj[parts[0]] = parts[1];
                }
            });
        }
        return assignmentObj;
    }

    static parseElementAssignment = function(assignment) {
        const assignmentObj = {};
        if (assignment && typeof assignment === "string") {
            const separator = assignment.includes(';') ? ';' : ',';
            assignment.split(separator).forEach(part => {
                const [fullKey, value] = part.split('=').map(item => item.trim());
                if (fullKey && value !== undefined) {
                    if (fullKey.startsWith("delete")) {
                        if (!assignmentObj["delete"]) {
                            assignmentObj["delete"] = [];
                        }
                        assignmentObj["delete"].push(value);
                    } else if (fullKey.startsWith("add")) {
                        if (!assignmentObj["add"]) {
                            assignmentObj["add"] = [];
                        }
                        assignmentObj["add"].push(value);
                    } else {
                        const [placeName, key] = fullKey.split('.'); // Separare il nome del posto e la chiave
                        if (!assignmentObj[placeName]) {
                            assignmentObj[placeName] = {};
                        }
                        assignmentObj[placeName][key] = value;
                    }
                }
            });
        }
        return assignmentObj;
    };

    static findPlaceByName(placeName, spaceModeler) {
        const allElements = spaceModeler._canvaspace.canvas._elementRegistry.getAll();
        return allElements.find(element =>
            is(element.businessObject, 'space:Place') && element.businessObject.name === placeName) || null;
    }

    static findTransitionByName(deleteValue, spaceModeler) {
        if (typeof deleteValue !== 'string') {
            console.warn('Valore di cancellazione non valido:', deleteValue);
            return null;
        }

        const [sourcePlaceName, targetPlaceName] = deleteValue.split('.');
        if (!sourcePlaceName || !targetPlaceName) {
            console.warn('Formato del valore di cancellazione non valido:', deleteValue);
            return null;
        }

        const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
        const connections = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));

        const sourcePlace = places.find(place => place.name === sourcePlaceName);
        const targetPlace = places.find(place => place.name === targetPlaceName);

        if (sourcePlace && targetPlace) {
            return connections.find(connection =>
                connection.sourcePlace.name === sourcePlace.name && connection.targetPlace.name === targetPlace.name
            );
        } else {
            console.warn(`Posto di origine o di destinazione non trovato: ${sourcePlaceName}, ${targetPlaceName}`);
            return null;
        }
    }

    static updatePlaceAssignmentWithElement(element, place, spaceModeler) {
        if (!element.businessObject || !element.businessObject.assignment) {
            return;
        }

        const elementAssignmentObj = this.parseElementAssignment(element.businessObject.assignment);
        const placeAssignmentOlcObj = this.parseAssignmentOlc(place.assignmentOlc);

        if (elementAssignmentObj["delete"]) {
            elementAssignmentObj["delete"].forEach(deleteValue => {
                const connectionToDelete = this.findTransitionByName(deleteValue, spaceModeler);
                if (connectionToDelete) {
                    const canvas = spaceModeler._canvaspace.canvas;
                    canvas.removeConnection(connectionToDelete);
                    canvas._elementRegistry.remove(connectionToDelete);
                }
            });
        }

        if (elementAssignmentObj[place.name]) {
            const elementPlaceAssignments = elementAssignmentObj[place.name];
            for (let key in elementPlaceAssignments) {
                if (placeAssignmentOlcObj[key] !== elementPlaceAssignments[key]) {
                    alert(`La variabile ${key} è stata aggiornata per il luogo ${place.name}: ${placeAssignmentOlcObj[key]} -> ${elementPlaceAssignments[key]}`);
                }
                placeAssignmentOlcObj[key] = elementPlaceAssignments[key];
            }
        }

        place.assignmentOlc = Object.entries(placeAssignmentOlcObj)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
    }
}
