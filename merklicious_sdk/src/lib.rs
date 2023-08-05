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
// use rs_merkle::{ MerkleProof, algorithms };

type HmacSha256 = Hmac<Sha256>;



//
// General Functions
//
pub fn now() -> ExternResult<u64> {
    sys_time()
	.map( |t| (t.as_micros() / 1000) as u64 )
}

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


// Trait for common fields
/// Common fields that are expected on some entry structs
pub trait CommonFields<'a> {
    /// A timestamp that indicates when the original create entry was made
    fn published_at(&'a self) -> &'a u64;
    /// A timestamp that indicates when this entry was created
    fn last_updated(&'a self) -> &'a u64;
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
///     pub published_at: u64,
///     pub last_updated: u64,
///     pub metadata: BTreeMap<String, rmpv::Value>,
/// }
/// common_fields!( PostEntry );
/// ```
#[macro_export]
macro_rules! common_fields {
    ( $name:ident ) => {
        impl<'a> CommonFields<'a> for $name {
            fn published_at(&'a self) -> &'a u64 {
                &self.published_at
            }
            fn last_updated(&'a self) -> &'a u64 {
                &self.last_updated
            }
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
    pub fn hash(&self) -> ExternResult<[u8; 32]> {
        sha256( &self )
    }
}

/// 
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LeafProofPayload {
    pub proof: Vec<[u8; 32]>,
    pub index: u64,
    pub target: LeafDataBlock,
    pub leaf: [u8; 32],
    pub root: [u8; 32],
    pub total_leaves: u64,
}



//
// Tree Entry
//
/// An entry struct for defining a group and its members
#[hdk_entry_helper]
#[derive(Clone)]
pub struct TreeEntry {
    /// The list of label/value pairs derived from the input
    pub data_blocks: Vec<LeafDataBlock>,
    pub leaves: Vec<[u8; 32]>,
    /// A secret entropy used for creating deterministic salts
    pub entropy: Vec<u8>,
    /// The root hash of this Merkle Tree
    pub root: [u8; 32],

    // common fields
    pub published_at: u64,
    pub last_updated: u64,
    pub metadata: BTreeMap<String, rmpv::Value>,
}
common_fields!( TreeEntry );

impl TreeEntry {
    /// Get the Merkle Tree root as a hex string
    pub fn root_as_hex(&self) -> String {
        hex::encode( self.root.to_owned() )
    }
}



//
// CSR Input Structs
//
/// Input required for registering new content to a group
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LeafInput {
    /// The field descriptor
    pub label: String,
    /// The field data
    pub value: rmpv::Value,
}

impl LeafInput {
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateTreeInput {
    pub leaves: Vec<LeafInput>,
    pub entropy: OptionalBytes,
}

/// 
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetLeafProofInput {
    pub tree_id: ActionHash,
    pub label: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VerifyLeafProofInput {
    pub proof: Vec<[u8; 32]>,
    pub index: u64,
    pub leaf: [u8; 32],
    pub root: [u8; 32],
    pub total_leaves: u64,
}



//
// Validation helpers
//
/// Checks that an entry's group reference and author are valid
pub fn validate_group_auth<T>(
    _entry: &T,
    _action: impl Into<EntryCreationAction>
) -> Result<(), String>
where
    T: TryFrom<Entry, Error = WasmError> + Clone,
{
    Ok(())
}



//
// Zome call helpers
//
/// Call a local zome function
///
/// ##### Example: Basic Usage
/// ```ignore
/// # use merklicious_sdk::*;
/// # use merklicious_sdk::hdk::prelude::*;
/// fn example() -> ExternResult<()> {
///     let group_id = "uhCkkrVjqWkvcFoq2Aw4LOSe6Yx9OgQLMNG-DiXqtT0nLx8uIM2j7";
///     let content_addr = "uhCkknDrZjzEgzf8iIQ6aEzbqEYrYBBg1pv_iTNUGAFJovhxOJqu0";
///
///     call_local_zome!(
///         "merklicious_csr",
///         "create_content_link",
///         merklicious_sdk::CreateContributionLinkInput {
///             group_id: ActionHash::try_from(group_id).unwrap(),
///             content_target: ActionHash::try_from(content_addr).unwrap().into(),
///         }
///     )?;
///
///     Ok(())
/// }
/// ```
#[macro_export]
macro_rules! call_local_zome {
    ( $zome:literal, $fn:literal, $($input:tt)+ ) => {
        {
            use merklicious_sdk::hdk;
            use merklicious_sdk::hdi_extensions::guest_error;

            match hdk::prelude::call(
                hdk::prelude::CallTargetCell::Local,
                $zome,
                $fn.into(),
                None,
                $($input)+,
            )? {
                ZomeCallResponse::Ok(extern_io) => Ok(extern_io),
                ZomeCallResponse::NetworkError(msg) => Err(guest_error!(format!("{}", msg))),
                ZomeCallResponse::CountersigningSession(msg) => Err(guest_error!(format!("{}", msg))),
                _ => Err(guest_error!(format!("Zome call response: Unauthorized"))),
            }
        }
    };
}
