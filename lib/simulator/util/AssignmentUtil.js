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

    static parseElementAssignment(assignment) {
        const assignmentObj = {};
        if (assignment && typeof assignment === "string") {
            const separator = assignment.includes(';') ? ';' : ',';
            assignment.split(separator).forEach(part => {
                const [fullKey, value] = part.split('=').map(item => item.trim());
                if (fullKey.startsWith("delete")) {
                    if (!assignmentObj["delete"]) {
                        assignmentObj["delete"] = [];
                    }
                    assignmentObj["delete"].push(value);
                    //console.log(assignmentObj)
                    //console.log(value)
                } else if (fullKey.startsWith("add")) {
                    if (!assignmentObj["add"]) {
                        assignmentObj["add"] = [];
                    }
                    assignmentObj["add"].push(value);
                    //console.log(assignmentObj)
                    //console.log(value)
                } else {
                    const [placeName, key] = fullKey.split('.'); // Separate the place name and the key
                    if (!assignmentObj[placeName]) {
                        assignmentObj[placeName] = {};
                    }
                    if (!assignmentObj[placeName][key]) {
                        assignmentObj[placeName][key] = []; // Initialize the array if it doesn't exist
                    }
                    assignmentObj[placeName][key].push(value);
                    console.log(placeName)
                    console.log(key)
                    console.log(value)
                }
            });
        }
        return assignmentObj;
    }

    static findPlaceByName(placeName, spaceModeler) {
        const allElements = spaceModeler._canvaspace.canvas._elementRegistry.getAll();

        //console.log('All Elements che sono SHAPEEEE:', allElements);

        // allElements.forEach(element => {
        //     console.log('Element shape:', element);
        // });

        return allElements.find(element =>
            is(element.businessObject, 'space:Place') && element.businessObject.name === placeName) || null;
    }

    static findTransitionByName(deleteValue, spaceModeler) {
        const [sourcePlaceName, targetPlaceName] = deleteValue.toString().split('.');
        const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
        const connections = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));

        const sourcePlace = places.find(place => place.name === sourcePlaceName);
        const targetPlace = places.find(place => place.name === targetPlaceName);

        if (sourcePlace && targetPlace) {
            return connections.find(connection =>
                connection.sourcePlace.name === sourcePlace.name && connection.targetPlace.name === targetPlace.name
            );
        } else {
            console.warn(`Source or target place not found: ${sourcePlaceName}, ${targetPlaceName}`);
            return null;
        }
    }

    static updatePlaceAssignmentWithElement(element, place, spaceModeler) {
        if (!element.businessObject || !element.businessObject.assignment) {
            //console.log('Element or its businessObject.assignment is undefined', element);
            return;
        }
        console.log("updatePlaceAssignmentWithElement")

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
