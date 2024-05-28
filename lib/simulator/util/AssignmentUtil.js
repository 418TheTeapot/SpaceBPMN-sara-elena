import { is } from "../../../example/lib/util/Util";

export class AssignmentUtil {
    static parseAssignmentOlc(assignmentOlc) {
        const assignmentObj = {};
        if (assignmentOlc && typeof assignmentOlc === "string") {
            assignmentOlc.toLowerCase().split(',').forEach(assignment => {
                const parts = assignment.split("=").map(part => part.trim().replace(/"/g, ''));
                if (parts.length === 2) {
                    assignmentObj[parts[0]] = parts[1];
                }
            });
        }
        return assignmentObj;
    }

    static parseElementAssignment(assignment) {
        const assignmentObj = {};
        if (assignment && typeof assignment === "string") {
            const separator = assignment.includes(';') ? ';' : ',';
            assignment.toLowerCase().split(separator).forEach(part => {
                const [fullKey, value] = part.split('=').map(item => item.trim());
                if (fullKey.startsWith("delete")) {
                    assignmentObj["delete"] = value;
                } else if (fullKey.startsWith("add")) {
                    assignmentObj["add"] = value;
                } else {
                    const [placeName, key] = fullKey.split('.'); // Separate the place name and the key
                    if (!assignmentObj[placeName]) {
                        assignmentObj[placeName] = {};
                    }
                    assignmentObj[placeName][key] = value;
                }
            });
        }
        return assignmentObj;
    }

    static findPlaceByName(placeName, spaceModeler) {
        const allElements = spaceModeler._canvaspace.canvas._elementRegistry.getAll();

        console.log('All Elements che sono SHAPEEEE:', allElements);

        allElements.forEach(element => {
            console.log('Element shape:', element);
        });

        return allElements.find(element =>
            is(element.businessObject, 'space:Place') && element.businessObject.name.toLowerCase() === placeName.toLowerCase()) || null;
    }

    static findTransitionByName(deleteValue, spaceModeler) {
        const [sourcePlaceName, targetPlaceName] = deleteValue.toLowerCase().split('.');
        const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
        const connections = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));

        const sourcePlace = places.find(place => place.name.toLowerCase() === sourcePlaceName);
        const targetPlace = places.find(place => place.name.toLowerCase() === targetPlaceName);

        if (sourcePlace && targetPlace) {
            return connections.find(connection =>
                connection.sourcePlace.name.toLowerCase() === sourcePlace.name.toLowerCase() && connection.targetPlace.name.toLowerCase() === targetPlace.name.toLowerCase()
            );
        } else {
            console.warn(`Source or target place not found: ${sourcePlaceName}, ${targetPlaceName}`);
            return null;
        }
    }

    static updatePlaceAssignmentWithElement(element, place, spaceModeler) {
        if (!element.businessObject || !element.businessObject.assignment) {
            console.log('Element or its businessObject.assignment is undefined', element);
            return;
        }

        const elementAssignmentObj = this.parseElementAssignment(element.businessObject.assignment);
        const placeAssignmentOlcObj = this.parseAssignmentOlc(place.assignmentOlc);

        console.log('Element Assignment Object:', elementAssignmentObj);
        console.log('Place Assignment OLC Object:', placeAssignmentOlcObj);

        if (elementAssignmentObj["delete"]) {
            const connectionToDelete = this.findTransitionByName(elementAssignmentObj["delete"], spaceModeler);
            if (connectionToDelete) {
                place.assignmentOlc = Object.entries(placeAssignmentOlcObj)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(',');
                return connectionToDelete;
            }
        }

        if (elementAssignmentObj[place.name.toLowerCase()]) {
            const elementPlaceAssignments = elementAssignmentObj[place.name.toLowerCase()];
            for (let key in elementPlaceAssignments) {
                placeAssignmentOlcObj[key] = elementPlaceAssignments[key];
            }
        }

        place.assignmentOlc = Object.entries(placeAssignmentOlcObj)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');

        return null;
    }
}
