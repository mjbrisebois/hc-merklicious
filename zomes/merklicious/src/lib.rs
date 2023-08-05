mod validation;

pub use merklicious_sdk;
pub use merklicious_sdk::hdi;
pub use merklicious_sdk::hdk;
pub use merklicious_sdk::hdi_extensions;
pub use merklicious_sdk::hdk_extensions;
pub use merklicious_sdk::holo_hash;

use serde::{
    Deserialize, Deserializer,
};
use merklicious_sdk::*;
use hdi::prelude::*;
use hdi_extensions::{
    guest_error,
    ScopedTypeConnector, scoped_type_connector,
};




/// The entry types defined for this `merklicious` integrity zome
#[hdk_entry_defs]
#[unit_enum(EntryTypesUnit)]
pub enum EntryTypes {
    #[entry_def(visibility = "private")]
    Tree(TreeEntry),
}

scoped_type_connector!(
    EntryTypesUnit::Tree,
    EntryTypes::Tree( TreeEntry )
);



/// The link types defined for this `merklicious` integrity zome
#[hdk_link_types]
pub enum LinkTypes {
    Tree,
}

impl TryFrom<String> for LinkTypes {
    type Error = WasmError;

    fn try_from(name: String) -> Result<Self, Self::Error> {
        Ok(
            match name.as_str() {
                "Tree" => LinkTypes::Tree,
                _ => return Err(guest_error!(format!("Unknown LinkTypes variant: {}", name ))),
            }
        )
    }
}

impl<'de> Deserialize<'de> for LinkTypes {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = Deserialize::deserialize(deserializer)?;
        Ok(
            LinkTypes::try_from( s.clone() )
                .or(Err(serde::de::Error::custom(format!("Unknown LinkTypes variant: {}", s))))?
        )
    }
}
