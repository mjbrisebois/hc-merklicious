pub use merklicious::hdi;
pub use merklicious::hdk;
pub use merklicious::hdi_extensions;
pub use merklicious::hdk_extensions;
pub use merklicious::holo_hash;

use std::collections::BTreeMap;
use lazy_static::lazy_static;
use rand::Rng;
use rs_merkle::{ MerkleTree, MerkleProof, algorithms };
use hdk::prelude::*;
use hdk_extensions::{
    must_get,
};
use hdi_extensions::{
    guest_error,
    ScopedTypeConnector,
};
use merklicious::{
    // EntryTypes,
    // EntryTypesUnit,
    // LinkTypes,
    merklicious_sdk::{
        // Entry Structs
        LeafDataBlock,
        LeafProofPayload,
        DataBlocksEntry,
        TreeEntry,
        // Input Structs
        CreateTreeInput,
        GetLeafProofInput,
        VerifyLeafProofInput,
    },

};



lazy_static! {
    static ref ZOME_NAME: String = match zome_info() {
        Ok(info) => format!("{}", info.name ),
        Err(_) => String::from("?"),
    };
}


#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    debug!("'{}' init", *ZOME_NAME );
    Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn whoami(_: ()) -> ExternResult<AgentInfo> {
    Ok( agent_info()? )
}


fn create_merkle_tree(data_blocks: &Vec<LeafDataBlock>) -> ExternResult<(MerkleTree<algorithms::Sha256>, Vec<[u8; 32]>)> {
    let leaves = data_blocks.clone().iter()
        .map(|leaf| leaf.hash() )
        .collect::<ExternResult<Vec<[u8; 32]>>>()?;
    let tree = MerkleTree::<algorithms::Sha256>::from_leaves(&leaves);

    debug!("Tree root: {:?}", tree.root() );
    Ok( (tree, leaves) )
}


#[hdk_extern]
pub fn create_tree(input: CreateTreeInput) -> ExternResult<ActionHash> {
    debug!("Creating new tree entry: {:#?}", input );
    let entropy = match input.entropy {
        Some(bytes) => bytes.to_vec(),
        None => {
            let mut rng = rand::thread_rng();
            (0..32).map(|_| rng.gen()).collect()
        },
    };
    let data_blocks = input.leaves.into_iter()
        .enumerate()
        .map(|(index, leaf_input)| {
            leaf_input.into_data_block( &entropy, index )
        })
        .collect::<ExternResult<Vec<LeafDataBlock>>>()?;
    let (merkle_tree, leaves) = create_merkle_tree( &data_blocks )?;

    let blocks_entry = DataBlocksEntry {
        blocks: data_blocks,

        // common fields
        metadata: BTreeMap::new(),
    };
    let blocks_action_hash = create_entry( blocks_entry.to_input() )?;

    let entry = TreeEntry {
        data_blocks: blocks_action_hash,
        leaves,
        entropy: entropy.to_vec(),
        root: merkle_tree.root()
            .ok_or(guest_error!(format!("Couldn't get the Merkle root")))?,

        // common fields
        metadata: BTreeMap::new(),
    };
    let action_hash = create_entry( entry.to_input() )?;

    Ok( action_hash )
}


#[hdk_extern]
pub fn get_tree(tree_id: ActionHash) -> ExternResult<TreeEntry> {
    debug!("Get latest tree entry: {}", tree_id );
    let record = must_get( &tree_id )?;

    Ok( TreeEntry::try_from_record( &record )? )
}


#[hdk_extern]
pub fn get_data_blocks(data_blocks_id: ActionHash) -> ExternResult<DataBlocksEntry> {
    debug!("Get latest tree entry: {}", data_blocks_id );
    let record = must_get( &data_blocks_id )?;

    Ok( DataBlocksEntry::try_from_record( &record )? )
}


#[hdk_extern]
pub fn hash_data_block(input: LeafDataBlock) -> ExternResult<[u8; 32]> {
    input.hash()
}


#[hdk_extern]
pub fn get_leaf_proof(input: GetLeafProofInput) -> ExternResult<LeafProofPayload> {
    debug!("Get proof for '{}' in tree: {}", input.label, input.tree_id );
    let tree_entry = get_tree( input.tree_id.clone() )?;
    let data_blocks = get_data_blocks( tree_entry.data_blocks.clone() )?.blocks;
    let (tree, _) = create_merkle_tree( &data_blocks )?;
    let target_index = data_blocks.iter()
        .position(|block| block.label == input.label )
        .ok_or(guest_error!(format!("Tree has no data block with the label '{}'", input.label )))?;
    let target = data_blocks[ target_index ].clone();
    let leaf = target.hash()?;
    let merkle_proof = tree.proof( &[target_index] );

    debug!("Tree root: {:?}", tree.root() );
    Ok(
        LeafProofPayload {
            proof: merkle_proof.proof_hashes().to_vec(),
            index: target_index as u64,
            target,
            leaf,
            root: tree_entry.root,
            total_leaves: data_blocks.len() as u64,
        }
    )
}


#[hdk_extern]
pub fn verify_leaf_proof(input: VerifyLeafProofInput) -> ExternResult<bool> {
    let proof = MerkleProof::<algorithms::Sha256>::new( input.proof );
    Ok( proof.verify( input.root, &[ input.index as usize ], &[ input.leaf ], input.total_leaves as usize ) )
}
