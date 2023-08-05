import { AgentPubKey, HoloHash,
	 ActionHash, EntryHash }	from '@whi/holo-hash';
import {
    OptionType, VecType, MapType,
}					from '@whi/into-struct';


export const EntryCreationActionStruct = {
    "type":			String,
    "author":			AgentPubKey,
    "timestamp":		Number,
    "action_seq":		Number,
    "prev_action":		ActionHash,
    "original_action_address":	OptionType( ActionHash ),
    "original_entry_address":	OptionType( EntryHash ),
    "entry_type": {
	"App": {
	    "entry_index":	Number,
	    "zome_index":	Number,
	    "visibility": {
		"Public":	null,
	    },
	},
    },
    "entry_hash":		EntryHash,
    "weight": {
	"bucket_id":		Number,
	"units":		Number,
	"rate_bytes":		Number,
    },
};

export const TreeStruct = {
    "data_blocks":		VecType( Object ),
    "leaves":			VecType( Uint8Array ),
    "entropy":			Uint8Array,
    "root":			Uint8Array,

    "published_at":		Number,
    "last_updated":		Number,

    "metadata":			Object,
};

export default {
    EntryCreationActionStruct,
    TreeStruct,
};
