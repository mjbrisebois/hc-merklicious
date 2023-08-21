
import { MerkleTree }			from 'merkletreejs'
import json				from '@whi/json';


export default {
    "__imports__": {
	Buffer,
	MerkleTree,
	json,
    },
    create_blocks ( blocks ) {
	const {
	    hash_entry,
	    create_entry,
	    create_link,
	}				= HDK;

	const entry			= new EntryTypes.DataBlocksEntry({
	    "blocks":		blocks,
	    "metadata":		{}
	});
	const id			= create_entry( entry );	// ActionHash

	return id;
    },
    create_tree ( leaves ) {
	const {
	    hash_entry,
	    create_entry,
	    create_link,
	}				= HDK;

	console.log("Create tree with leaves: %s", json.debug(leaves) );
	const tree			= new MerkleTree(
	    leaves.map( leaf => Buffer.from(leaf).toString("hex") ),
	    undefined,
	    {
		"hashLeaves": false,
		"sortLeaves": true,
	    }
	);
	const root			= tree.getRoot();

	const entry			= new EntryTypes.TreeEntry({
	    "data_blocks":	null,
	    leaves,
	    root,
	    "metadata":		{}
	});
	const id			= create_entry( entry );	// ActionHash

	return id;
    },
    get_tree ( tree_id ) {
	const {
	    must_get_action,
	    must_get_entry,
	}			= HDK;

	const tree_create		= must_get_action( tree_id );
	const tree_entry		= must_get_entry( tree_create.action.entry_hash )
	    .content
	    .toEntryType( EntryTypes.TreeEntry )
	    .content();

	return tree_entry;
    },
    get_leaf_proof ({ tree_id, index }) {
	const {
	    must_get_action,
	    must_get_entry,
	}			= HDK;

	const tree_create		= must_get_action( tree_id );
	const tree_entry		= must_get_entry( tree_create.action.entry_hash )
	    .content
	    .toEntryType( EntryTypes.TreeEntry )
	    .content();
	const leaves			= tree_entry.leaves.map( leaf => Buffer.from(leaf).toString("hex") );
	const tree			= new MerkleTree(
	    leaves,
	    undefined,
	    {
		"hashLeaves": false,
		"sortLeaves": true,
	    }
	);
	console.log( tree.toTreeString() );
	const leaf			= leaves[ index ];
	const proof			= tree.getProof( leaf );
	const root			= tree.getRoot();

	return {
	    proof,
	    leaf,
	    root,
	};
    },
};
