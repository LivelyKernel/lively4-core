//format: {nodeList:[node,node},attrList:[attrName,attrName],lastVals:[attrVal,attrVal],funcSign}
const constraintList = []

//evtl sollte man eine node zu constraint zuordnung hinzufügen

export default class Constraints {
    /**
     * Goes through all constraints and uses the give function to enforce them.
     */
    enforceConstraints() {
        for (var i = 0; i < constraintList.length; i++) {
            constraintList[i].funcSig(constraintList[i].nodes, constraintList[i].attrList, constraintList[i].lastVals);
        }
    }
    /**
     * Adds a new constraint
     * @param nodes List with involved nodes
     * @param attr List with the according attributes
     * @param lastVals List with the current values of these attributes
     * @param funcSig A function that will be called during the enforcement of the constraint. Function needs to have the form func(nodes,attr,lastVals).
     */
    setConstraint(nodes, attr, lastVals, funcSig) {
        constraintList.push({nodeList: nodes, attrList: attr, lastVals: lastVals, funcSig: funcSig});
    }
    /**
     * Removes a constraint from the constraintList
     * @param constraint An object pointer to the constraint that you want to remove
     */
    removeConstraint(constraint) {
        var index = constraintList.indexOf(constraint);
        if (index !== -1) {
            constraintList.splice(index, 1);
        }
    }
    /**
     * Sets all attr to the last changed attr
     * @param nodes nodeList
     * @param attr attrList
     * @param lastVals Last value of attributes
     */
    constraint2beEqual(nodes, attr, lastVals) {
        var changedIndex = this.findChangedNode(attr, lastVals);
        if (changedIndex !== -1) {
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].attributes[attr[i]] = nodes[changedIndex].attributes[attr[changedIndex]];
                lastVals[i] = nodes[i].attributes[attr[i]];
            }
        } else {
            console.log("None of the values have changed.")
        }
    }
    /**
     * Finds the index of a node in the constraint sublist that has a changed value
     * @param attr Attribute array
     * @param lastVals Array with the last values of the attributes
     * @returns {number} Returns index of the changed in node in the node array or -1 if nothing changed
     */
    findChangedNode(nodes, attr, lastVals) {
        for (var i = 0; i < attr.length; i++) {
            if (nodes[i].attributes[attr[i]] !== lastVals[i]) {
                return i;
            }
        }
        //if not found
        return -1;
    }
}