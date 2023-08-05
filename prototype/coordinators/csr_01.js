
import crypto				from 'crypto';
import { MerkleTree }			from 'merkletreejs'
import hashjs				from 'hash.js';
import DRBG				from 'hmac-drbg';
import msgpack				from '@msgpack/msgpack';
import json				from '@whi/json';
import ObjectWalk			from '@whi/object-walk';
import common				from './common.js';


export default {
    "__imports__": {
	Buffer,
	crypto,
	common,
	msgpack,
	hashjs,
	DRBG,
	MerkleTree,
	sha256 ( input ) {
	    const hash			= crypto.createHash("sha256");
	    hash.update( json.toBytes( input ) );
	    return new Uint8Array( hash.digest() );
	},
	hex ( bytes ) {
	    return Buffer.from( bytes ).toString("hex");
	},
	object_walk ( obj, replacer ) {
	    return ObjectWalk.walk( obj, replacer );
	},
	OBJECT_WALK_DELETE: ObjectWalk.DELETE,
    },
    create_tree ( data ) {
	const {
	    hash_entry,
	    create_entry,
	    create_link,
	}				= HDK;

	const entropy			= crypto.randomBytes( 32 );
	const hmac_input		= {
	    "hash": hashjs.sha256,
	    "entropy": entropy,
	    "nonce": entropy,
	    "pers": null,
	};
	console.log( hmac_input );
	const hmac			= new DRBG( hmac_input );
	const leaves			= common.flatten_data( data );
	leaves.forEach( leaf => {
	    leaf.salt			= hmac.generate( 32 );
	});
	console.log( leaves );
	const tree			= new MerkleTree(
	    leaves.map( leaf => sha256(msgpack.encode(leaf, { "sortKeys": true })) ),
	    undefined,
	    {
		"hashLeaves": false,
		"sortLeaves": true,
	    }
	);
	const hash			= tree.getRoot();

	const entry			= new EntryTypes.TreeEntry({
	    "input":			data,
	    leaves,
	    entropy,
	    hash,
	    "published_at":	new Date(),
	    "last_updated":	new Date(),
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
    get_leaf_proof ({ tree_id, label }) {
	const {
	    must_get_action,
	    must_get_entry,
	}			= HDK;

	const tree_create		= must_get_action( tree_id );
	const tree_entry		= must_get_entry( tree_create.action.entry_hash )
	    .content
	    .toEntryType( EntryTypes.TreeEntry )
	    .content();
	const leaves			= tree_entry.leaves;
	const tree			= new MerkleTree(
	    leaves.map( leaf => sha256(msgpack.encode(leaf, { "sortKeys": true })) ),
	    undefined,
	    {
		"hashLeaves": false,
		"sortLeaves": true,
	    }
	);
	console.log( tree.toTreeString() );
	const target			= leaves.find( leaf => leaf.label === label );
	const leaf			= sha256(msgpack.encode( target, { "sortKeys": true } ));
	const proof			= tree.getProof( leaf );
	const root			= tree.getRoot();

	return {
	    proof,
	    target,
	    leaf,
	    root,
	};
    },
};
