import { is } from "../../../example/lib/util/Util";

export class AssignmentUtil {
    // Method to parse OLC assignment string into an object
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

    // Method to parse element assignment string into an object
    static parseElementAssignment(assignment) {
        const assignmentObj = {};
        if (assignment && typeof assignment === "string") {
            const separator = assignment.includes(';') ? ';' : ',';
            assignment.split(separator).forEach(part => {
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

    // Method to find a place by name
    static findPlaceByName(placeName, spaceModeler) {
        const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
        return places.find(place => place.name === placeName) || null;
    }

    // Method to find a transition between two places using their names
    static findTransitionByName(deleteValue, spaceModeler) {
        const [sourcePlaceName, targetPlaceName] = deleteValue.split('.');
        const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
        const connections = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));

        const sourcePlace = places.find(place => place.name === sourcePlaceName);
        const targetPlace = places.find(place => place.name === targetPlaceName);
        console.log(sourcePlace)
        console.log(targetPlace)

        if (sourcePlace && targetPlace) {
            return connections.find(connection =>
                connection.sourcePlace.name === sourcePlace.name && connection.targetPlace.name === targetPlace.name
            );
        } else {
            console.warn(`Source or target place not found: ${sourcePlaceName}, ${targetPlaceName}`);
            return null;
        }
    }

    // Method to update the assignment value of the place with that of the element
    static updatePlaceAssignmentWithElement(element, place, spaceModeler) {
        if (!element.businessObject || !element.businessObject.assignment) {
            console.log('Element or its businessObject.assignment is undefined', element);
            return;
        }

        const elementAssignmentObj = this.parseElementAssignment(element.businessObject.assignment);
        const placeAssignmentOlcObj = this.parseAssignmentOlc(place.assignmentOlc);

        console.log('Element Assignment Object:', elementAssignmentObj);
        console.log('Place Assignment OLC Object:', placeAssignmentOlcObj);

        // Handle deletion of transitions
        if (elementAssignmentObj["delete"]) {
            const connectionToDelete = this.findTransitionByName(elementAssignmentObj["delete"], spaceModeler);
            if (connectionToDelete) {
                place.assignmentOlc = Object.entries(placeAssignmentOlcObj)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(',');
                return connectionToDelete;
            }
        }

        // Handle place-specific assignments
        if (elementAssignmentObj[place.name]) {
            const elementPlaceAssignments = elementAssignmentObj[place.name];
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
