
import {
    DNA,
}					from '@whi/holochain-prototyping';

import { PathEntry,
	 DataBlocksEntry,
	 TreeEntry }			from './entries.js';
import coordinator			from './coordinators/csr_01.js';


export const dna = new DNA([
    {
	"EntryTypes": [
	    PathEntry,
	    DataBlocksEntry,
	    TreeEntry,
	],
	"LinkTypes": [
	    "Branch",
	],
	"validation": ( op ) => {
	    const {
		StoreEntry,
		StoreRecord,
		AppEntryBytes,
		OpEntry,
		CreateEntry,
		UpdateEntry,

		must_get_action,
		must_get_valid_record,
		trace_origin,
		heritage,
	    }			= HDI;
	    console.log("Validating %s from agent: %s", op.heritage(), op.author );

	    const flat_op	= op.flattened( EntryTypes );

	    if ( flat_op instanceof OpEntry ) { // StoreEntry
		if ( flat_op instanceof CreateEntry ) {
		    console.log("Validate create entry");

		    // if ( flat_op.app_entry instanceof EntryTypes.LeafEntry ) {
		    // 	const entry	= flat_op.app_entry.content();
		    // 	console.log("Validate Leaf", entry );

		    // 	if ( String(sha256( entry.content )) !== String(entry.hash) )
		    // 	    throw new Error(`Leaf content and hash do not match`);
		    // }

		    if ( flat_op.app_entry instanceof EntryTypes.TreeEntry ) {
			console.log("Validate Tree");
		    }
		}

		if ( flat_op instanceof UpdateEntry ) {
		    console.log("Validate update entry");

		    if ( flat_op.app_entry instanceof EntryTypes.TreeEntry ) {
			console.log("Validate Tree");
		    }
		}
	    }
	},
    },
], {
    ...coordinator.__imports__,
});


export default {
    dna
};
