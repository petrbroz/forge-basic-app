export class SummaryExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
    }

    load() {
        console.log('SummaryExtension loaded.');
        return true;
    }

    unload() {
        console.log('SummaryExtension unloaded.');
        return true;
    }

    async findPropertyOccurrences(model, propName) {
        /**
         * Custom user function for querying the property database.
         * @param {object} pdb Property database (see https://forge.autodesk.com/en/docs/viewer/v6/reference/globals/PropertyDatabase).
         * @param {string} attrName Property name to find the occurrences for.
         * @returns {object} Summary of values for specific property, with IDs of objects with the specific combinations:
         *   {
         *     '<property value>': [<dbid>, <dbid>, ...],
         *     '<property value>': [<dbid>, <dbid>, ...]
         *   }
         */
        function userFunction(pdb, attrName) {
            let attrId = -1;
            pdb.enumAttributes(function (i, attrDef) {
                if (attrDef.name === attrName) {
                    attrId = i;
                    return true;
                }
            });
            let summary = {};
            if (attrId !== -1) {
                const objectCount = pdb.getObjectCount();
                pdb.enumObjects(function (objectId) {
                    pdb.enumObjectProperties(objectId, function (_attrId, valId) {
                        if (_attrId === attrId) {
                            const attrVal = pdb.getAttrValue(attrId, valId);
                            summary[attrVal] ||= [];
                            summary[attrVal].push(objectId);
                        }
                    });
                }, 1, objectCount);
            }
            return summary;
        };
        const result = await model.getPropertyDb().executeUserFunction(userFunction, propName);
        return result;
    }

    async findPropertiesOccurrences(model) {
        /**
         * Custom user function for querying the property database.
         * @param {object} pdb Property database (see https://forge.autodesk.com/en/docs/viewer/v6/reference/globals/PropertyDatabase).
         * @returns {object} Summary of property names and values, with IDs of objects with the specific combinations:
         *   {
         *     '<property name>': {
         *       '<property value>': [<dbid>, <dbid>, ...],
         *       '<property value>': [<dbid>, <dbid>, ...]
         *     },
         *     '<property name>': {
         *       '<property value>': [<dbid>, <dbid>, ...],
         *       '<property value>': [<dbid>, <dbid>, ...]
         *     }
         *   }
         */
        function userFunction(pdb) {
            let summary = {};
            const objectCount = pdb.getObjectCount();
            pdb.enumObjects(function (objectId) {
                pdb.enumObjectProperties(objectId, function (attrId, valId) {
                    const attrDef = pdb.getAttributeDef(attrId);
                    const attrVal = pdb.getAttrValue(attrId, valId);
                    summary[attrDef.name] ||= {};
                    summary[attrDef.name][attrVal] ||= [];
                    summary[attrDef.name][attrVal].push(objectId);
                });
            }, 1, objectCount);
            return summary;
        };
        const result = await model.getPropertyDb().executeUserFunction(userFunction);
        return result;
    }
}