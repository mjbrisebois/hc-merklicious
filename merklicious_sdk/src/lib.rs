pub use hdk_extensions::hdi;
pub use hdk_extensions::holo_hash;
pub use hdk_extensions::hdk;
pub use hdk_extensions::hdi_extensions;
pub use hdk_extensions;

use std::collections::BTreeMap;
use hex;
use hdi_extensions::guest_error;
use hdi::prelude::*;
use hdk::prelude::sys_time;
use hmac::{ Hmac, Mac };
use sha2::{ Sha256, Digest };
use rmp_serde;

type HmacSha256 = Hmac<Sha256>;



//
// General Functions
//
/// Get a current timestamp according to the HDK's [`sys_time`]
pub fn now() -> ExternResult<u64> {
    sys_time()
	.map( |t| (t.as_micros() / 1000) as u64 )
}

/// Serialize the given data using [`rmp_serde`] and return the SHA-256 hash
pub fn sha256<T>(data: &T) -> ExternResult<[u8; 32]>
where
    T: Serialize + std::fmt::Debug,
{
    let bytes = rmp_serde::to_vec( &data )
        .or(Err(guest_error!(format!("Failed to serialize input; {:#?}", data))))?;
    let mut hasher = Sha256::new();
    hasher.update( &bytes );
    Ok(
        <[u8; 32]>::from( hasher.finalize() )
    )
}



// Trait for common fields
/// Common fields that are expected on some entry structs
pub trait CommonFields<'a> {
    /// A spot for holding data that is not relevant to integrity validation
    fn metadata(&'a self) -> &'a BTreeMap<String, rmpv::Value>;
}

/// Auto-implement the [`CommonFields`] trait
///
/// The input must be a struct with fields matching each common field method.
///
/// #### Example
/// ```ignore
/// struct PostEntry {
///     pub message: String,
///
///     // Common fields
///     pub metadata: BTreeMap<String, rmpv::Value>,
/// }
/// common_fields!( PostEntry );
/// ```
#[macro_export]
macro_rules! common_fields {
    ( $name:ident ) => {
        impl<'a> CommonFields<'a> for $name {
            fn metadata(&'a self) -> &'a BTreeMap<String, rmpv::Value> {
                &self.metadata
            }
        }
    };
}



//
// Common Structs
//
/// The piece of data that a Merkle Tree leaf represents
#[hdk_entry_helper]
#[derive(Clone)]
pub struct LeafDataBlock {
    /// The field descriptor
    pub label: String,
    /// The field data
    pub value: rmpv::Value,
    /// Some entropy to prevent value guessing
    #[serde(with = "serde_bytes")]
    pub salt: Vec<u8>,
}

impl LeafDataBlock {
    /// Get a sha256 hash of this struct
    pub fn hash(&self) -> ExternResult<[u8; 32]> {
        sha256( &self )
    }
}

/// All the information required to verify a leaf
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LeafProofPayload {
    /// The Merkle proof hash list
    pub proof: Vec<[u8; 32]>,
    /// The leaf's index in the Merkle tree
    pub index: u64,
    /// The revealed leaf data
    pub target: LeafDataBlock,
    /// The sha256 hash of the target leaf
    pub leaf: [u8; 32],
    /// The Merkle tree's root hash
    pub root: [u8; 32],
    /// The total number of leaves in the Merkle tree
    pub total_leaves: u64,
}



//
// Tree Entry
//
/// An entry struct for storing the leaf data blocks that were used to create a tree
#[hdk_entry_helper]
#[derive(Clone)]
pub struct DataBlocksEntry {
    /// A list of leaf data blocks
    pub blocks: Vec<LeafDataBlock>,

    // common fields
    pub metadata: BTreeMap<String, rmpv::Value>,
}
common_fields!( DataBlocksEntry );


/// An entry struct that represents a Merkle tree
#[hdk_entry_helper]
#[derive(Clone)]
pub struct TreeEntry {
    /// The leaf data blocks used to create this tree
    pub data_blocks: ActionHash,
    /// The leaf hashes of this Merkle tree
    pub leaves: Vec<[u8; 32]>,
    /// A secret entropy used for creating deterministic salts
    pub entropy: Vec<u8>,
    /// The root hash of this Merkle tree
    pub root: [u8; 32],

    // common fields
    pub metadata: BTreeMap<String, rmpv::Value>,
}
common_fields!( TreeEntry );

impl TreeEntry {
    /// Get the Merkle tree root as a hex string
    pub fn root_as_hex(&self) -> String {
        hex::encode( self.root.to_owned() )
    }
}



//
// Claim Entry
//
/// An entry struct for making a claim about a Merkle tree
#[hdk_entry_helper]
#[derive(Clone)]
pub struct ClaimEntry {
    /// The name of this claim
    pub name: String,
    /// The author making the claim
    pub author: AgentPubKey,
    /// A reference to the Merkle tree
    pub root: [u8; 32],

    // common fields
    pub metadata: BTreeMap<String, rmpv::Value>,
}
common_fields!( ClaimEntry );



//
// CSR Input Structs
//
/// Input required for a leaf data block
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LeafInput {
    /// The field descriptor
    pub label: String,
    /// The field data
    pub value: rmpv::Value,
}

impl LeafInput {
    /// Create a [`LeafDataBlock`] from this leaf input
    ///
    /// This method generates a deterministic salt using the entropy and index provided
    pub fn into_data_block(self, entropy: &Vec<u8>, index: usize) -> ExternResult<LeafDataBlock> {
        let mut hmac = HmacSha256::new_from_slice( entropy.as_slice() )
            .or(Err(guest_error!(format!("Failed to create hmac with entropy: {:#?}", entropy ))))?;

        hmac.update( &index.to_le_bytes() );
        let result = hmac.finalize();

        Ok(
            LeafDataBlock {
                label: self.label,
                value: self.value,
                salt: result.into_bytes().to_vec(),
            }
        )
    }
}

type OptionalBytes = Option<serde_bytes::ByteBuf>;

/// Input required for creating a tree entry
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateTreeInput {
    /// A list of data blocks used as the Merkle tree leaves
    pub leaves: Vec<LeafInput>,
    /// Entropy used for creating deterministic salts for each leaf
    pub entropy: OptionalBytes,
}

/// Input required for getting a leaf proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetLeafProofInput {
    /// The create action for the target tree entry
    pub tree_id: ActionHash,
    /// The label of the target leaf
    pub label: String,
}

/// Input required for verifying a single leaf proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VerifyLeafProofInput {
    /// The Merkle proof hash list
    pub proof: Vec<[u8; 32]>,
    /// The leaf's index in the Merkle tree
    pub index: u64,
    /// The sha256 hash of the target leaf
    pub leaf: [u8; 32],
    /// The Merkle tree's root hash
    pub root: [u8; 32],
    /// The total number of leaves in the Merkle tree
    pub total_leaves: u64,
}



#[cfg(test)]
mod tests {
    use super::{ sha256, Serialize };

    #[test]
    fn test_sha256() {
        #[derive(Debug, Serialize)]
        pub struct Data( Option<u8> );

        assert_eq!( sha256( &Data(None) ).unwrap(), [
            228, 255, 94, 125, 122, 127, 8, 233,
            128, 10, 62, 37, 203, 119, 69, 51,
            203, 32, 4, 13, 243, 11, 107, 161,
            15, 149, 111, 154, 205, 14, 179, 247
        ] );
    }
}
