
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
	"input":			Object,
	"leaves":			VecType( Object ),
	"entropy":			Uint8Array,
	"hash":				Uint8Array,

	"published_at":			Date,
	"last_updated":			Date,

	"metadata":			Object,
    };
}


export { PathEntry }			from '@whi/holochain-prototyping';


export default {
    TreeEntry,
    PathEntry,
};
