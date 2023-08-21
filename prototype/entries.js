
import { faker }			from '@faker-js/faker';
import {
    HoloHash, AgentPubKey,
    ActionHash, EntryHash,
    AnyLinkableHash,
}					from '@spartan-hc/holo-hash';
import {
    AppEntryType,
    OptionType, VecType, MapType,
    PathEntry,
    BoilerPlateSet,
}					from '@whi/holochain-prototyping';


export class TreeEntry extends AppEntryType {
    static struct			= {
	"data_blocks":			OptionType( ActionHash ),
	"leaves":			VecType( Uint8Array ),
	"root":				Uint8Array,

	"metadata":			Object,
    };
}

export class DataBlocksEntry extends AppEntryType {
    static struct			= {
	"blocks":			VecType( Object ),
	"metadata":			Object,
    };
}


export { PathEntry }			from '@whi/holochain-prototyping';


export default {
    DataBlocksEntry,
    TreeEntry,
    PathEntry,
};
