
import crypto				from 'crypto';
import treeify				from 'treeify';

import MerkleTools			from 'merkle-tools';
import MerkleJson			from 'merkle-json';
import { MerkleTree }			from 'merkletreejs'
import { encode, decode }		from '@msgpack/msgpack';


const filesystem		= { // file structure
    "dir_01": {
	"file_01.jpg": crypto.randomBytes( 500 ),
	"file_02.txt": "bla bla bla",
	"dir_02": {
	    "file_04.md": "# title",
	},
    },
    "file_03.mp4": crypto.randomBytes( 1000 ),
};
console.log( treeify.asTree( filesystem, true, (...args) => {
    console.log( ...args );
}) );

const leaves			= [
    filesystem.dir_01["file_01.jpg"],
    filesystem.dir_01["file_02.txt"],
    filesystem.dir_01.dir_02["file_04.md"],
    filesystem["file_03.mp4"],
];

{
    console.log("Testing 'merkle-tools'")
    const tree			= new MerkleTools();

    tree.addLeaves( leaves, true );

    console.log( tree.getLeafCount() );
    console.log( tree.getLeaf(0).toString("hex") );
    console.log( tree.getLeaf(1).toString("hex") );
    console.log( tree.getLeaf(2).toString("hex") );
    console.log( tree.getLeaf(3).toString("hex") );
    console.log( tree.getMerkleRoot() );
    console.log( tree.getTreeReadyState() );
    console.log( tree.makeTree() );
    console.log( tree.getTreeReadyState() );
    console.log( tree.getMerkleRoot().toString("hex") );
    console.log( tree.getProof(0) );
    console.log( tree.validateProof( tree.getProof(0), tree.getLeaf(0), tree.getMerkleRoot() ) );
}

{
    console.log("Testing 'merkle-json'")
    console.log( MerkleJson );
    const tree			= new MerkleJson.MerkleJson();
    console.log( tree );

    const hash			= tree.hash( filesystem );
    console.log( hash );

    const text			= tree.stringify( filesystem );
    console.log( text );
}

{
    const sha256		= (data) => crypto.createHash('sha256').update(data).digest();

    console.log("Testing 'merkletreejs'")
    const tree			= new MerkleTree(
	leaves.map( leaf => sha256(encode(leaf)) ),
	undefined,
	{
	    "hashLeaves": false,
	    "sortLeaves": true,
	}
    );
    console.log( tree );

    const root			= tree.getRoot().toString("hex");
    console.log( root );

    const leaf			= sha256(encode( leaves[2] ));
    console.log( tree.getLayers() );
    console.log( tree.getLayersAsObject() );
    console.log( tree.getLeaves() );
    console.log( tree.toString() );
    console.log( tree.toTreeString() );
    console.log( tree.getLeafIndex( leaf ) );
    console.log( tree.binarySearch( tree.getLeaves(), leaf,  Buffer.compare ) );

    const proof			= tree.getProof( leaf );
    console.log( proof.map( layer => layer.data = layer.data.toString("hex") ), leaf.toString("hex"), root );
    console.log( tree.verify( proof, leaf.toString("hex"), root ) );

    const any_tree		= new MerkleTree(
	[],
	undefined,
	{
	    "hashLeaves": false,
	    "sortLeaves": true,
	}
    );
    console.log( any_tree.verify( proof, leaf, root ) );
}
