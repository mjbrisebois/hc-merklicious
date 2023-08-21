
console.log("Integrity Modeling - Merklicious\n");

import crypto				from 'crypto';
import { expect }			from 'chai';
import { MerkleTree }			from 'merkletreejs'
import { faker }			from '@faker-js/faker';
import hashjs				from 'hash.js';
import DRBG				from 'hmac-drbg';
import msgpack				from '@msgpack/msgpack';
import json				from '@whi/json';
import {
    HoloHash, AgentPubKey,
    ActionHash, EntryHash,
    AnyLinkableHash,
}					from '@spartan-hc/holo-hash';
import {
    Cell,
}					from '@whi/holochain-prototyping';

import common				from './coordinators/common.js';
import coordinator			from './coordinators/csr_01.js';
import { dna }				from './dna.js';


function sha256 ( input ) {
    const hash			= crypto.createHash("sha256");
    if ( !(input instanceof Uint8Array) )
	input			= msgpack.encode( input, { "sortKeys": true });
    hash.update( input );
    return new Uint8Array( hash.digest() );
}

// Setup for tests
const agent_1 			= new AgentPubKey( crypto.randomBytes(32) ).addTag("A1");

const cell_1			= new Cell( agent_1, dna );

cell_1.injectCoordinator( 0, "main", coordinator );


// Phase 1
//
// - An agent creates a merkle tree
// - Some signing authorities certify the tree
// - Another agent requests 1 leaf of the tree
// - The agent reveals the answer
// - The other agent can verify that the leaf is valid
//

// const tree_1_input		= { // file structure
//     "dir_01": {
// 	"file_01.jpg": crypto.randomBytes( 500 ),
// 	"file_02.txt": "bla bla bla",
// 	"dir_02": {
// 	    "file_04.md": "# title",
// 	},
//     },
//     "file_03.mp4": crypto.randomBytes( 1000 ),
// };
//
// The resulting tree will have variable depths and child nodes
// [ // root
//     [ // dir_01
//         leaf, // file_01.jpg
//         leaf, // file_02.txt
//         [ // dir_02
//             leaf, // file_04.md
//         ],
//     ],
//     leaf, // file_03.mp4
// ]

// const tree_1_input		= {
//     "name": {
// 	"first": "Marty",
// 	"last": "McFly",
//     },
//     "date_of_birth": "June 12, 1968",
// };

// const tree_1_input		= [{
//     "label": "first_name",
//     "value": "Marty",
// }, {
//     "label": "last_name",
//     "value": "McFly",
// }, {
//     "label": "date_of_birth",
//     "value": "June 12, 1968",
// }];

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
const entropy			= crypto.randomBytes( 32 );
const hmac_input		= {
    "hash": hashjs.sha256,
    "entropy": entropy,
    "nonce": entropy,
    "pers": null,
};
const hmac			= new DRBG( hmac_input );
const blocks			= common.flatten_data( drivers_license );
blocks.forEach( block => {
    block.salt			= hmac.generate( 32 );
});
const leaves			= blocks.map( block => sha256(block) );

const tree_1_id			= cell_1.callZomeFunction("main", "create_tree", leaves )
      .addTag("T1");
console.log("Created tree: %s", tree_1_id.toString(true) );

const tree			= cell_1.callZomeFunction("main", "get_tree", tree_1_id );
console.log("Merkle Tree:", json.debug(tree) );

const label			= "date_of_birth";
const block_index		= blocks.findIndex( block => block.label === label );
const proof_pack		= cell_1.callZomeFunction("main", "get_leaf_proof", {
    "tree_id": tree_1_id,
    "index": block_index,
});
console.log("Proof:", json.debug(proof_pack) );

const mt			= new MerkleTree([]);

{
    const verified			= mt.verify(
	proof_pack.proof,
	sha256( blocks[ block_index ] ),
	Buffer.from(tree.root),
    );
    console.log( verified );
}
