// Utility class for handling assignments
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
        //es.element.businessObject.assignment = "delete=a.b";
        // es. delete=a.b;
        // assignmentObj = {delete: 'a.b'}
        //a= placeName, b = targetPlaceName
    }

// Method to delete a transition between two places using their names

static deleteTransitionByName(deleteValue, spaceModeler) {
  const [sourcePlaceName, targetPlaceName] = deleteValue.split('.');
  const places = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Place'));
  const connections = spaceModeler._places.get('Elements').filter(e => is(e, 'space:Transition'));
  const canvas = spaceModeler._canvas;

  const sourcePlace = places.find(place => place.name === sourcePlaceName);
  const targetPlace = places.find(place => place.name === targetPlaceName);

  if (sourcePlace && targetPlace) {
    const connectionToDelete = connections.find(connection =>
      connection.sourcePlace.name === sourcePlace.name && connection.targetPlace.name === targetPlace.name
    );

    if (connectionToDelete) {
      const transitionId = connectionToDelete.id; // Get the ID of the transition

      if (connectionToDelete.waypoints) {
        console.log('Connection to delete:', connectionToDelete.waypoints[0].x, connectionToDelete.waypoints[0].y);
      }

      if (connectionToDelete.type === 'space:Transition') {
        canvas.removeConnection(connectionToDelete);
        canvas._elementRegistry.remove(connectionToDelete);
        console.log(`Deleted transition from ${sourcePlaceName} to ${targetPlaceName}`);
        return transitionId; // Return the ID of the deleted transition
      } else {
        console.warn(`No transition found from ${sourcePlaceName} to ${targetPlaceName}`);
      }
    }
  } else {
    console.warn(`Source or target place not found: ${sourcePlaceName}, ${targetPlaceName}`);
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
            this.deleteTransitionByName(elementAssignmentObj["delete"], spaceModeler);
        }

        if (elementAssignmentObj[place.name]) {
            const elementPlaceAssignments = elementAssignmentObj[place.name];
            for (let key in elementPlaceAssignments) {
                if (key in placeAssignmentOlcObj) {
                    placeAssignmentOlcObj[key] = elementPlaceAssignments[key];
                }
            }
        }

        place.assignmentOlc = Object.entries(placeAssignmentOlcObj)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');

    }
}
