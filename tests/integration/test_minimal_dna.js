import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-minimal-dna", process.env.LOG_LEVEL );

import fs				from 'node:fs';
import path				from 'path';
import crypto				from 'crypto';
import { expect }			from 'chai';
import { faker }			from '@faker-js/faker';
import msgpack				from '@msgpack/msgpack';
import json				from '@whi/json';
import { AgentPubKey, HoloHash,
	 ActionHash, EntryHash }	from '@whi/holo-hash';
import HolochainBackdrop		from '@whi/holochain-backdrop';
const { Holochain }			= HolochainBackdrop;
import {
    intoStruct,
    OptionType, VecType, MapType,
}					from '@whi/into-struct';

// const why				= require('why-is-node-running');
import {
    expect_reject,
    flatten_data,
    linearSuite,
    createTreeInput,
}					from '../utils.js';
import {
    EntryCreationActionStruct,
    TreeStruct,
    ProofDetails,
}					from './types.js';

const delay				= (n) => new Promise(f => setTimeout(f, n));
const __filename			= new URL(import.meta.url).pathname;
const __dirname				= path.dirname( __filename );
const TEST_DNA_PATH			= path.join( __dirname, "../minimal_dna.dna" );

const clients				= {};
const DNA_NAME				= "test_dna";

const MAIN_ZOME				= "merklicious_csr";



let tree, t1_addr;

const drivers_license			= {
    "id": "134711-320",
    "date_issued": Date.now(),
    "class": JSON.stringify([ 5, 6 ]),
    "condition": null,
    "expires_at": Date.now() + (5 * 365 * 24 * 3600 * 1000), // in 5 years
    "name": {
	"first": "Sam",
	"middle": [],
	"last": "Sample",
    },
    "address": {
	"street": "24 My Place Street",
	"city": "Anywhere",
	"province": "Alberta",
	"country": "Canada",
	"postal_code": "T5J 2M6"
    },
    "date_of_birth": (new Date("1971-11-20")).getTime(),
    "sex": "male",
    "appearance": {
	"eyes": {
	    "color": "brown",
	},
	"hair": {
	    "color": "brown",
	},
	"height": JSON.stringify({
	    "value": 182,
	    "unit": "cm",
	}),
	"weight": JSON.stringify({
	    "value": 83,
	    "unit": "kg",
	}),
    },
    "organ_donor": true,
    "photo": crypto.randomBytes( 500 ),
};


function basic_tests () {

    it("should create tree", async function () {
	let leaves			= flatten_data( drivers_license );
	t1_addr				= new ActionHash( await clients.alice.call( DNA_NAME, MAIN_ZOME, "create_tree", {
	    "leaves": leaves,
	}) );
	log.debug("Tree ID: %s", t1_addr );

	expect( t1_addr		).to.be.a("ActionHash");
	expect( t1_addr		).to.have.length( 39 );

	tree				= intoStruct( await clients.alice.call( DNA_NAME, MAIN_ZOME, "get_tree", t1_addr ), TreeStruct );
	log.debug( json.debug( tree ) );
    });

    it("should get proof", async function () {
	const result			= await clients.alice.call( DNA_NAME, MAIN_ZOME, "get_leaf_proof", {
	    "tree_id": t1_addr,
	    "label": "date_of_birth",
	});
	log.debug("Merkle proof payload:", result );
	const details			= intoStruct( result, ProofDetails );
	log.debug("Proof details: %s", json.debug(details) );

	// Verify that the hash of 'target' is in fact the leaf returned in proof
	const block_hash		= await clients.alice.call( DNA_NAME, MAIN_ZOME, "hash_data_block", result.target );

	expect( block_hash		).to.deep.equal( result.leaf );

	const verify			= await clients.bobby.call( DNA_NAME, MAIN_ZOME, "verify_leaf_proof", {
	    "proof": result.proof,
	    "index": result.index,
	    "leaf": result.leaf,
	    "root": result.root,
	    "total_leaves": result.total_leaves,
	});
	log.debug("Merkle proof verified:", verify );

	expect( verify			).to.be.true;
    });

    it("should generating output for docs", async function () {
	const client			= {
	    call ( ...args ) {
		return clients.alice.call( DNA_NAME, MAIN_ZOME, ...args );
	    }
	}

	const data_blocks = [{
	    "label": "name.first",
	    "value": "Count",
	},{
	    "label": "name.last",
	    "value": "Dracula",
	},{
	    "label": "address.street",
	    "value": "Str. G-ral Traian Mosoiu, nr.24, Bran",
	},{
	    "label": "address.city",
	    "value": null,
	},{
	    "label": "address.region",
	    "value": "Transylvania",
	},{
	    "label": "address.country",
	    "value": "Romania",
	},{
	    "label": "date_of_birth",
	    "value": "1476-12-14",
	},{
	    "label": "appearance.height",
	    "value": "{\"value\"193,\"unit\":\"cm\"}",
	},{
	    "label": "appearance.weight",
	    "value": "{\"value\":102,\"unit\":\"kg\"}",
	},{
	    "label": "organ_donor",
	    "value": false,
	}];

	const tree_addr = await client.call( "create_tree", {
	    "leaves": data_blocks,
	});
	log.trace("%s", json.debug(tree_addr) );

	const tree = await client.call( "get_tree", tree_addr );
	log.trace("%s", json.debug(tree) );

	const details = await client.call( "get_leaf_proof", {
	    "tree_id": tree_addr,
	    "label": "date_of_birth",
	});
	log.trace("%s", json.debug(details) );

	const target_hash = await client.call( "hash_data_block", details.target );
	log.trace("%s", json.debug(target_hash) );

	const verify = await client.call( "verify_leaf_proof", {
	    "tree_id": tree_addr,
	    "proof": details.proof,
	    "index": details.index,
	    "leaf": details.leaf,
	    "root": details.root,
	    "total_leaves": details.total_leaves,
	});
	log.trace("%s", json.debug(verify) );
    });

}


function error_tests () {
}


describe("Minimal DNA", function () {
    const holochain			= new Holochain({
	"timeout": 60_000,
	"default_stdout_loggers": process.env.LOG_LEVEL === "trace",
    });

    before(async function () {
	this.timeout( 300_000 );

	const actors			= await holochain.backdrop({
	    "test_happ": {
		[DNA_NAME]:		TEST_DNA_PATH,
	    },
	}, {
	    "actors": [
		"alice",
		"bobby",
	    ],
	});

	for ( let name in actors ) {
	    for ( let app_prefix in actors[ name ] ) {
		log.info("Upgrade client for %s => %s", name, app_prefix );
		const client		= clients[ name ]	= actors[ name ][ app_prefix ].client;
	    }
	}

	// Must call whoami on each cell to ensure that init has finished.
	{
	    let whoami			= await clients.alice.call( DNA_NAME, MAIN_ZOME, "whoami", null, 300_000 );
	    log.normal("Alice whoami: %s", String(new HoloHash( whoami.agent_initial_pubkey )) );
	}
    });

    describe("Merklicious", function () {
	linearSuite( "Basic", basic_tests );
	// linearSuite( "Error", error_tests );
    });

    after(async () => {
	await holochain.destroy();
    });

});
